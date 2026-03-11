import { useState } from 'react';
import { motion } from 'framer-motion';
import { GitBranch, Zap, Clock, Play, Plus, ChevronRight } from 'lucide-react';
import WorkflowBuilder from '../components/WorkflowBuilder';
import ProgressModal from '../components/ProgressModal';

const SAVED_WORKFLOWS = [
  { id: 'wf-1', name: 'PDF Compress & Send', steps: 3, lastRun: '2h ago', color: '#f97316' },
  { id: 'wf-2', name: 'Image Batch Optimize', steps: 4, lastRun: '1d ago', color: '#22c55e' },
  { id: 'wf-3', name: 'Report Generator', steps: 6, lastRun: '3d ago', color: '#8b5cf6' },
];

export default function Workflow() {
  const [modalOpen, setModalOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('processing');

  const handleRunWorkflow = (workflow) => {
    setStatus('processing');
    setProgress(0);
    setModalOpen(true);

    // Simulate progress
    let p = 0;
    const interval = setInterval(() => {
      p += Math.random() * 8;
      if (p >= 100) {
        p = 100;
        clearInterval(interval);
        setTimeout(() => setStatus('success'), 500);
      }
      setProgress(Math.min(p, 100));
    }, 200);
  };

  const handleSaveWorkflow = (workflow) => {
    console.log('Saving workflow:', workflow);
  };

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }} className="pt-20">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10"
        >
          <div>
            <span
              className="inline-block px-3 py-1 rounded-full text-xs font-display font-bold mb-3"
              style={{ background: 'var(--tag-bg)', color: 'var(--tag-text)' }}
            >
              AUTOMATION
            </span>
            <h1 className="font-display font-black text-4xl sm:text-5xl mb-2" style={{ color: 'var(--text)' }}>
              Workflow Builder
            </h1>
            <p className="text-base" style={{ color: 'var(--text-secondary)' }}>
              Chain tools together to automate complex file operations
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.97 }}
            className="forge-btn forge-btn-primary flex items-center gap-2 text-sm"
          >
            <Plus size={15} />
            New Workflow
          </motion.button>
        </motion.div>

        {/* Saved workflows */}
        {SAVED_WORKFLOWS.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-10"
          >
            <h2 className="font-display font-bold text-lg mb-4" style={{ color: 'var(--text)' }}>
              Saved Workflows
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {SAVED_WORKFLOWS.map((wf, i) => (
                <motion.div
                  key={wf.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="forge-card p-4 group cursor-pointer"
                  whileHover={{ y: -3 }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: `${wf.color}15`, border: `1px solid ${wf.color}30` }}
                    >
                      <GitBranch size={16} style={{ color: wf.color }} />
                    </div>
                    <button className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: 'var(--accent)', color: 'white' }}
                      onClick={() => handleRunWorkflow(wf)}>
                      <Play size={12} />
                    </button>
                  </div>
                  <h3 className="font-display font-bold text-sm mb-1" style={{ color: 'var(--text)' }}>
                    {wf.name}
                  </h3>
                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {wf.steps} steps
                    </span>
                    <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                      <Clock size={10} /> {wf.lastRun}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Info banner */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-start gap-3 p-4 rounded-xl mb-8"
          style={{ background: 'var(--accent-subtle)', border: '1px solid var(--border-accent)' }}
        >
          <Zap size={16} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 2 }} />
          <div>
            <p className="text-sm font-display font-semibold" style={{ color: 'var(--accent)' }}>
              Pro tip
            </p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Drag steps to reorder them. Click the settings icon on any step to configure its parameters.
            </p>
          </div>
        </motion.div>

        {/* Workflow Builder */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <WorkflowBuilder onSave={handleSaveWorkflow} onRun={handleRunWorkflow} />
        </motion.div>
      </div>

      <ProgressModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        progress={progress}
        status={status}
        title="Running Workflow"
        subtitle="Executing your automated workflow..."
        onDownload={() => setModalOpen(false)}
      />
    </div>
  );
}
