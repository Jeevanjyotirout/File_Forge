import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, CloudUpload, FolderOpen, X, CheckCircle } from 'lucide-react';
import { formatFileSize, getFileIcon, getFileColor, validateFiles } from '../utils/fileUtils';

export default function UploadZone({
  onFilesAccepted,
  acceptedTypes = null,
  maxFiles = 10,
  maxSizeMB = 100,
  multiple = true,
  compact = false,
}) {
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState([]);
  const [justDropped, setJustDropped] = useState(false);

  const onDrop = useCallback((acceptedFiles) => {
    const { validFiles, errors: validationErrors } = validateFiles(acceptedFiles, {
      allowedTypes: acceptedTypes,
      maxSizeMB,
      maxFiles,
    });

    setErrors(validationErrors);

    if (validFiles.length > 0) {
      setJustDropped(true);
      setTimeout(() => setJustDropped(false), 1500);

      const newFiles = validFiles.map((f) => ({
        id: `${Date.now()}-${Math.random()}`,
        file: f,
        name: f.name,
        size: f.size,
        type: f.type,
      }));

      setFiles((prev) => {
        const updated = multiple ? [...prev, ...newFiles] : newFiles;
        onFilesAccepted?.(updated.map((f) => f.file));
        return updated;
      });
    }
  }, [acceptedTypes, maxFiles, maxSizeMB, multiple, onFilesAccepted]);

  const removeFile = (id) => {
    setFiles((prev) => {
      const updated = prev.filter((f) => f.id !== id);
      onFilesAccepted?.(updated.map((f) => f.file));
      return updated;
    });
  };

  const clearAll = () => {
    setFiles([]);
    setErrors([]);
    onFilesAccepted?.([]);
  };

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    multiple,
    ...(acceptedTypes && {
      accept: acceptedTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    }),
  });

  const particles = Array.from({ length: 8 });

  return (
    <div className="w-full">
      <motion.div
        {...getRootProps()}
        className="relative cursor-pointer rounded-2xl overflow-hidden transition-all duration-300"
        whileHover={{ scale: 1.005 }}
        style={{
          border: isDragActive
            ? '2px dashed var(--accent)'
            : isDragReject
            ? '2px dashed #ef4444'
            : '2px dashed var(--border)',
          background: isDragActive
            ? 'var(--accent-subtle)'
            : 'var(--input-bg)',
          minHeight: compact ? '120px' : '220px',
        }}
        animate={{
          borderColor: isDragActive ? 'var(--accent)' : undefined,
        }}
      >
        <input {...getInputProps()} />

        {/* Animated particles on drag */}
        <AnimatePresence>
          {isDragActive && particles.map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full pointer-events-none"
              style={{ background: 'var(--accent)' }}
              initial={{
                x: `${Math.random() * 100}%`,
                y: '100%',
                opacity: 0,
                scale: 0,
              }}
              animate={{
                y: `${Math.random() * 80}%`,
                opacity: [0, 1, 0],
                scale: [0, 1.5, 0],
              }}
              transition={{
                duration: 1.5 + Math.random(),
                delay: i * 0.15,
                repeat: Infinity,
              }}
            />
          ))}
        </AnimatePresence>

        {/* Drop success flash */}
        <AnimatePresence>
          {justDropped && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center z-10"
              style={{ background: 'var(--accent-subtle)' }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ type: 'spring', stiffness: 400 }}
              >
                <CheckCircle size={48} style={{ color: 'var(--accent)' }} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col items-center justify-center h-full py-10 px-6 text-center">
          <motion.div
            animate={isDragActive ? { y: [-5, 5, -5], scale: 1.1 } : { y: 0, scale: 1 }}
            transition={isDragActive ? { repeat: Infinity, duration: 1 } : {}}
            className="mb-4"
          >
            {isDragActive ? (
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: 'var(--accent)', boxShadow: '0 0 30px var(--accent-glow)' }}
              >
                <CloudUpload size={28} color="white" />
              </div>
            ) : (
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <Upload size={28} style={{ color: 'var(--accent)' }} />
              </div>
            )}
          </motion.div>

          {isDragActive ? (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-display font-bold text-lg"
              style={{ color: 'var(--accent)' }}
            >
              Release to upload!
            </motion.p>
          ) : (
            <>
              <p className="font-display font-bold text-base mb-1" style={{ color: 'var(--text)' }}>
                Drop files here or{' '}
                <span style={{ color: 'var(--accent)' }}>browse</span>
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {acceptedTypes
                  ? `Supports: ${acceptedTypes.map(t => t.split('/').pop().toUpperCase()).join(', ')}`
                  : 'Supports all file types'}
                {' '} · Max {maxSizeMB}MB per file
              </p>
            </>
          )}
        </div>
      </motion.div>

      {/* Errors */}
      <AnimatePresence>
        {errors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-3 p-3 rounded-xl"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
          >
            {errors.map((err, i) => (
              <p key={i} className="text-sm text-red-400">{err}</p>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* File List */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-display font-semibold" style={{ color: 'var(--text-secondary)' }}>
                {files.length} file{files.length > 1 ? 's' : ''} ready
              </p>
              <button
                onClick={clearAll}
                className="text-xs px-3 py-1 rounded-lg transition-colors"
                style={{ color: 'var(--text-muted)', background: 'var(--surface)' }}
              >
                Clear all
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {files.map((f, i) => (
                <motion.div
                  key={f.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20, height: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <span className="text-xl">{getFileIcon(f.name)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
                      {f.name}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {formatFileSize(f.size)}
                    </p>
                  </div>
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: getFileColor(f.name) }}
                  />
                  <button
                    onClick={() => removeFile(f.id)}
                    className="p-1 rounded-lg transition-colors hover:bg-red-500/10"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <X size={14} />
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
