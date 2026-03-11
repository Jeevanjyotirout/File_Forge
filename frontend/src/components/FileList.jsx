import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download, Trash2, Eye, MoreHorizontal,
  CheckSquare, Square, SortAsc, SortDesc, Grid, List
} from 'lucide-react';
import { formatFileSize, getFileIcon, getFileColor, truncateFilename } from '../utils/fileUtils';

export default function FileList({ files = [], onDownload, onDelete, onPreview, showActions = true }) {
  const [selected, setSelected] = useState(new Set());
  const [sortBy, setSortBy] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [viewMode, setViewMode] = useState('list');

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected(selected.size === files.length ? new Set() : new Set(files.map((f) => f.id)));
  };

  const handleSort = (key) => {
    if (sortBy === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(key); setSortDir('asc'); }
  };

  const sorted = [...files].sort((a, b) => {
    let val = 0;
    if (sortBy === 'name') val = a.name.localeCompare(b.name);
    else if (sortBy === 'size') val = a.size - b.size;
    else if (sortBy === 'date') val = new Date(b.createdAt) - new Date(a.createdAt);
    return sortDir === 'asc' ? val : -val;
  });

  if (files.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-16 text-center"
      >
        <div className="text-5xl mb-4">📂</div>
        <p className="font-display font-bold text-lg mb-1" style={{ color: 'var(--text)' }}>
          No files yet
        </p>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Upload files to see them here
        </p>
      </motion.div>
    );
  }

  return (
    <div className="w-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleAll}
            className="flex items-center gap-2 text-sm transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            {selected.size === files.length
              ? <CheckSquare size={16} style={{ color: 'var(--accent)' }} />
              : <Square size={16} />}
            <span className="hidden sm:inline">{selected.size > 0 ? `${selected.size} selected` : 'Select all'}</span>
          </button>

          <AnimatePresence>
            {selected.size > 0 && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex items-center gap-2"
              >
                <button
                  onClick={() => selected.forEach((id) => onDownload?.(id))}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                  style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}
                >
                  <Download size={12} /> Download
                </button>
                <button
                  onClick={() => { selected.forEach((id) => onDelete?.(id)); setSelected(new Set()); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                  style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444' }}
                >
                  <Trash2 size={12} /> Delete
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'var(--text-secondary)', background: 'var(--surface)' }}
          >
            {viewMode === 'list' ? <Grid size={15} /> : <List size={15} />}
          </button>
        </div>
      </div>

      {/* Header (list mode) */}
      {viewMode === 'list' && (
        <div
          className="grid gap-3 px-3 py-2 rounded-lg mb-2 text-xs font-display font-semibold"
          style={{
            gridTemplateColumns: '24px 1fr 80px 100px 80px',
            color: 'var(--text-muted)',
            background: 'var(--surface)',
          }}
        >
          <div />
          <button onClick={() => handleSort('name')} className="flex items-center gap-1 hover:text-[var(--accent)] transition-colors">
            Name {sortBy === 'name' && (sortDir === 'asc' ? <SortAsc size={11} /> : <SortDesc size={11} />)}
          </button>
          <button onClick={() => handleSort('size')} className="flex items-center gap-1 hover:text-[var(--accent)] transition-colors">
            Size {sortBy === 'size' && (sortDir === 'asc' ? <SortAsc size={11} /> : <SortDesc size={11} />)}
          </button>
          <span>Type</span>
          {showActions && <span>Actions</span>}
        </div>
      )}

      {/* File rows */}
      {viewMode === 'list' ? (
        <div className="flex flex-col gap-1.5">
          <AnimatePresence>
            {sorted.map((file, i) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 30, height: 0 }}
                transition={{ delay: i * 0.04 }}
                className="grid items-center px-3 py-3 rounded-xl transition-all cursor-pointer"
                style={{
                  gridTemplateColumns: '24px 1fr 80px 100px 80px',
                  background: selected.has(file.id) ? 'var(--accent-subtle)' : 'var(--surface)',
                  border: `1px solid ${selected.has(file.id) ? 'var(--border-accent)' : 'var(--border)'}`,
                  gap: '12px',
                }}
                onClick={() => toggleSelect(file.id)}
              >
                <div onClick={(e) => { e.stopPropagation(); toggleSelect(file.id); }}>
                  {selected.has(file.id)
                    ? <CheckSquare size={16} style={{ color: 'var(--accent)' }} />
                    : <Square size={16} style={{ color: 'var(--text-muted)' }} />}
                </div>

                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-lg flex-shrink-0">{getFileIcon(file.name)}</span>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate" style={{ color: 'var(--text)' }}>
                      {truncateFilename(file.name, 30)}
                    </p>
                    {file.status && (
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {file.status}
                      </span>
                    )}
                  </div>
                </div>

                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {formatFileSize(file.size)}
                </span>

                <div className="flex items-center gap-1.5">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: getFileColor(file.name) }}
                  />
                  <span className="text-xs uppercase font-mono" style={{ color: 'var(--text-muted)' }}>
                    {file.name.split('.').pop()}
                  </span>
                </div>

                {showActions && (
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onPreview?.(file)}
                      className="p-1.5 rounded-lg transition-colors hover:bg-[var(--accent-subtle)]"
                      style={{ color: 'var(--text-muted)' }}
                      title="Preview"
                    >
                      <Eye size={13} />
                    </button>
                    <button
                      onClick={() => onDownload?.(file.id)}
                      className="p-1.5 rounded-lg transition-colors hover:bg-[var(--accent-subtle)]"
                      style={{ color: 'var(--text-muted)' }}
                      title="Download"
                    >
                      <Download size={13} />
                    </button>
                    <button
                      onClick={() => onDelete?.(file.id)}
                      className="p-1.5 rounded-lg transition-colors hover:bg-red-500/10 hover:text-red-400"
                      style={{ color: 'var(--text-muted)' }}
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {sorted.map((file, i) => (
            <motion.div
              key={file.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="forge-card p-4 cursor-pointer"
              style={{
                border: `1px solid ${selected.has(file.id) ? 'var(--border-accent)' : 'var(--border)'}`,
              }}
              onClick={() => toggleSelect(file.id)}
            >
              <div className="text-4xl mb-3 text-center">{getFileIcon(file.name)}</div>
              <p className="text-xs font-medium text-center truncate" style={{ color: 'var(--text)' }}>
                {truncateFilename(file.name, 15)}
              </p>
              <p className="text-xs text-center mt-1" style={{ color: 'var(--text-muted)' }}>
                {formatFileSize(file.size)}
              </p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
