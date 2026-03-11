"""
FileForge – Celery Worker Entry Point
======================================
Configures and exposes the Celery application used by all workers.
Run with:
    celery -A worker.celery_worker worker --loglevel=info --concurrency=4
"""

import os
import logging
from celery import Celery
from celery.signals import (
    worker_ready,
    worker_shutdown,
    task_prerun,
    task_postrun,
    task_failure,
    task_retry,
)
from kombu import Queue, Exchange

# ── Logging ──────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger("fileforge.worker")


# ── Redis URLs ────────────────────────────────────────────────────────────────
REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")
REDIS_RESULT_URL = os.getenv("REDIS_RESULT_URL", "redis://redis:6379/1")


# ── Celery App ────────────────────────────────────────────────────────────────
celery_app = Celery(
    "fileforge",
    broker=REDIS_URL,
    backend=REDIS_RESULT_URL,
    include=["worker.tasks"],
)

# ── Queue Definitions ─────────────────────────────────────────────────────────
default_exchange = Exchange("default", type="direct")
pdf_exchange = Exchange("pdf", type="direct")
image_exchange = Exchange("image", type="direct")
ai_exchange = Exchange("ai", type="direct")

celery_app.conf.task_queues = (
    Queue("default", default_exchange, routing_key="default"),
    Queue("pdf", pdf_exchange, routing_key="pdf"),
    Queue("image", image_exchange, routing_key="image"),
    Queue("ai", ai_exchange, routing_key="ai"),
    Queue("high_priority", default_exchange, routing_key="high"),
)

celery_app.conf.task_default_queue = "default"
celery_app.conf.task_default_exchange = "default"
celery_app.conf.task_default_routing_key = "default"

# ── Task Routing ──────────────────────────────────────────────────────────────
celery_app.conf.task_routes = {
    "worker.tasks.merge_pdfs": {"queue": "pdf"},
    "worker.tasks.split_pdf": {"queue": "pdf"},
    "worker.tasks.compress_pdf": {"queue": "pdf"},
    "worker.tasks.convert_pdf_to_word": {"queue": "pdf"},
    "worker.tasks.convert_word_to_pdf": {"queue": "pdf"},
    "worker.tasks.rotate_pdf": {"queue": "pdf"},
    "worker.tasks.add_watermark": {"queue": "pdf"},
    "worker.tasks.protect_pdf": {"queue": "pdf"},
    "worker.tasks.extract_pdf_pages": {"queue": "pdf"},
    "worker.tasks.compress_image": {"queue": "image"},
    "worker.tasks.resize_image": {"queue": "image"},
    "worker.tasks.convert_image": {"queue": "image"},
    "worker.tasks.images_to_pdf": {"queue": "image"},
    "worker.tasks.create_zip_archive": {"queue": "default"},
    "worker.tasks.run_ocr": {"queue": "ai"},
    "worker.tasks.run_workflow": {"queue": "default"},
    "worker.tasks.cleanup_expired_files": {"queue": "default"},
}

# ── Celery Configuration ──────────────────────────────────────────────────────
celery_app.conf.update(
    # Serialization
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    # Timezone
    timezone="UTC",
    enable_utc=True,
    # Result backend
    result_expires=3600,            # Results live 1 hour
    result_backend_transport_options={
        "master_name": "mymaster",
    },
    # Task execution
    task_acks_late=True,             # Ack after task completes (safer)
    task_reject_on_worker_lost=True, # Re-queue if worker crashes
    worker_prefetch_multiplier=1,    # One task at a time per worker (for heavy tasks)
    # Retries
    task_max_retries=3,
    task_default_retry_delay=30,
    # Soft / hard time limits (seconds)
    task_soft_time_limit=270,        # Warn at 4.5 min
    task_time_limit=300,             # Kill at 5 min
    # Beat schedule for housekeeping
    beat_schedule={
        "cleanup-expired-files": {
            "task": "worker.tasks.cleanup_expired_files",
            "schedule": 300.0,       # Every 5 minutes
        },
    },
    # Worker
    worker_max_tasks_per_child=200,  # Restart worker process every 200 tasks
    worker_max_memory_per_child=512000,  # 512 MB RSS limit
)


# ── Signals ───────────────────────────────────────────────────────────────────
@worker_ready.connect
def on_worker_ready(sender, **kwargs):
    log.info("🔥 FileForge worker is ready — queues: pdf | image | ai | default")


@worker_shutdown.connect
def on_worker_shutdown(sender, **kwargs):
    log.info("👋 FileForge worker shutting down — cleaning up…")


@task_prerun.connect
def on_task_prerun(task_id, task, args, kwargs, **kw):
    log.info(f"▶  Task started  | {task.name} | id={task_id}")


@task_postrun.connect
def on_task_postrun(task_id, task, args, kwargs, retval, state, **kw):
    log.info(f"✓  Task finished | {task.name} | id={task_id} | state={state}")


@task_failure.connect
def on_task_failure(task_id, exception, traceback, sender, **kwargs):
    log.error(f"✗  Task FAILED   | {sender.name} | id={task_id} | error={exception}")


@task_retry.connect
def on_task_retry(request, reason, einfo, **kwargs):
    log.warning(f"↻  Task RETRY    | {request.task} | reason={reason}")


# ── Dev helper ────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    celery_app.start()
