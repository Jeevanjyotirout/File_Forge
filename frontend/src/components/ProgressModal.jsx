import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Download, Loader2 } from 'lucide-react';

const stages = ['Uploading', 'Processing', 'Optimizing', 'Finalizing'];

export default function ProgressModal({
  isOpen,
  onClose,
  progress = 0,
  status = 'processing', // 'uploading' | 'processing' | 'success' | 'error'
  title = 'Processing Files',
  subtitle = 'Please wait while we process your files...',
  files = [],
  onDownload,
  errorMessage,
}) {
  const [stageIndex, setStageIndex] = useState(0);
  const [displayProgress, setDisplayProgress] = useState(0);

  useEffect(() => {
    if (progress > displayProgress) {
      const diff = progress - displayProgress;
      const step = Math.max(1, diff / 20);
      const timer = setInterval(() => {
        setDisplayProgress((prev) => {
          if (prev >= progress) { clearInterval(timer); return prev; }
          return Math.min(progress, prev + step);
        });
      }, 30);
      return () => clearInterval(timer);
    }
  }, [progress]);

  useEffect(() => {
    if (status === 'processing') {
      const interval = setInterval(() => {
        setStageIndex((prev) => (prev < stages.length - 1 ? prev + 1 : prev));
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [status]);

  useEffect(() => {
    if (!isOpen) {
      setStageIndex(0);
      setDisplayProgress(0);
    }
  }, [isOpen]);

  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (displayProgress / 100) * circumference;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
            onClick={status === 'success' || status === 'error' ? onClose : undefined}
          >
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 30 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="relative w-full max-w-md rounded-3xl p-8 overflow-hidden"
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button (only when done) */}
              {(status === 'success' || status === 'error') && (
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 rounded-xl transition-colors"
                  style={{ color: 'var(--text-muted)', background: 'var(--surface)' }}
                >
                  <X size={16} />
                </button>
              )}

              {/* Status: Processing / Uploading */}
              {(status === 'processing' || status === 'uploading') && (
                <div className="flex flex-col items-center">
                  {/* Circular progress */}
                  <div className="relative w-32 h-32 mb-6">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50" cy="50" r="45"
                        fill="none"
                        stroke="var(--progress-track)"
                        strokeWidth="6"
                      />
                      <motion.circle
                        cx="50" cy="50" r="45"
                        fill="none"
                        stroke="var(--accent)"
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        transition={{ duration: 0.3 }}
                        style={{ filter: 'drop-shadow(0 0 6px var(--accent-glow))' }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="font-display font-bold text-2xl" style={{ color: 'var(--text)' }}>
                        {Math.round(displayProgress)}%
                      </span>
                    </div>
                  </div>

                  <h3 className="font-display font-bold text-xl mb-2" style={{ color: 'var(--text)' }}>
                    {title}
                  </h3>

                  {/* Animated stages */}
                  <div className="flex items-center gap-2 mb-6">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
                    >
                      <Loader2 size={14} style={{ color: 'var(--accent)' }} />
                    </motion.div>
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={stageIndex}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="text-sm"
                        style={{ color: 'var(--accent)' }}
                      >
                        {stages[stageIndex]}...
                      </motion.span>
                    </AnimatePresence>
                  </div>

                  {/* Stage dots */}
                  <div className="flex items-center gap-2">
                    {stages.map((s, i) => (
                      <motion.div
                        key={s}
                        className="h-1.5 rounded-full transition-all duration-500"
                        style={{
                          width: i === stageIndex ? '24px' : '8px',
                          background: i <= stageIndex ? 'var(--accent)' : 'var(--border)',
                        }}
                      />
                    ))}
                  </div>

                  {/* File list being processed */}
                  {files.length > 0 && (
                    <div className="mt-6 w-full">
                      {files.slice(0, 3).map((f, i) => (
                        <motion.div
                          key={i}
                          className="flex items-center gap-3 py-2"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.1 }}
                        >
                          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--accent)' }} />
                          <span className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                            {f.name || f}
                          </span>
                        </motion.div>
                      ))}
                      {files.length > 3 && (
                        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                          +{files.length - 3} more files
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Status: Success */}
              {status === 'success' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, delay: 0.1 }}
                    className="mb-5"
                  >
                    <CheckCircle size={64} style={{ color: '#22c55e' }} />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <h3 className="font-display font-bold text-2xl mb-2" style={{ color: 'var(--text)' }}>
                      Done!
                    </h3>
                    <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                      Your files are ready to download
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.03, y: -2 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={onDownload}
                      className="forge-btn forge-btn-primary flex items-center gap-2 mx-auto"
                      style={{ boxShadow: 'var(--shadow-accent)' }}
                    >
                      <Download size={16} />
                      Download Results
                    </motion.button>
                  </motion.div>
                </motion.div>
              )}

              {/* Status: Error */}
              {status === 'error' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center text-center"
                >
                  <motion.div
                    initial={{ scale: 0, rotate: -30 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 400 }}
                    className="mb-5"
                  >
                    <AlertCircle size={64} className="text-red-400" />
                  </motion.div>
                  <h3 className="font-display font-bold text-xl mb-2" style={{ color: 'var(--text)' }}>
                    Something went wrong
                  </h3>
                  <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                    {errorMessage || 'An error occurred while processing your files. Please try again.'}
                  </p>
                  <button
                    onClick={onClose}
                    className="forge-btn forge-btn-ghost"
                  >
                    Try Again
                  </button>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
