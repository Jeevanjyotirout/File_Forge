import { useState } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
  Plus, Trash2, Play, Save, GripVertical,
  ChevronDown, ChevronRight, Settings2, Workflow,
  FileOutput, Zap, GitBranch
} from 'lucide-react';

const AVAILABLE_STEPS = [
  { id: 'upload', label: 'Upload Files', icon: '📤', color: '#3b82f6', category: 'Input' },
  { id: 'compress', label: 'Compress PDF', icon: '🗜️', color: '#f97316', category: 'PDF' },
  { id: 'merge', label: 'Merge PDFs', icon: '🔗', color: '#8b5cf6', category: 'PDF' },
  { id: 'split', label: 'Split PDF', icon: '✂️', color: '#ec4899', category: 'PDF' },
  { id: 'convert-word', label: 'PDF to Word', icon: '📝', color: '#22c55e', category: 'Convert' },
  { id: 'convert-pdf', label: 'Word to PDF', icon: '📄', color: '#ef4444', category: 'Convert' },
  { id: 'resize-image', label: 'Resize Image', icon: '🖼️', color: '#06b6d4', category: 'Image' },
  { id: 'compress-image', label: 'Compress Image', icon: '📦', color: '#f59e0b', category: 'Image' },
  { id: 'watermark', label: 'Add Watermark', icon: '💧', color: '#6366f1', category: 'PDF' },
  { id: 'download', label: 'Download Output', icon: '⬇️', color: '#14b8a6', category: 'Output' },
];

function WorkflowStep({ step, index, onRemove, onConfigure, isLast }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="relative">
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.85, height: 0 }}
        className="forge-card p-4 cursor-grab active:cursor-grabbing"
        style={{ borderColor: `${step.color}30` }}
      >
        <div className="flex items-center gap-3">
          <div style={{ color: 'var(--text-muted)' }}>
            <GripVertical size={16} />
          </div>

          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
            style={{ background: `${step.color}15`, border: `1px solid ${step.color}30` }}
          >
            {step.icon}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ background: 'var(--surface)', color: 'var(--text-muted)' }}>
                {String(index + 1).padStart(2, '0')}
              </span>
              <p className="font-display font-semibold text-sm" style={{ color: 'var(--text)' }}>
                {step.label}
              </p>
            </div>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {step.category}
            </p>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: 'var(--text-muted)', background: 'var(--surface)' }}
            >
              <Settings2 size={13} />
            </button>
            <button
              onClick={() => onRemove(step.instanceId)}
              className="p-1.5 rounded-lg transition-colors hover:bg-red-500/10 hover:text-red-400"
              style={{ color: 'var(--text-muted)' }}
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {/* Config panel */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                <p className="text-xs font-display font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>
                  STEP SETTINGS
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {step.id === 'compress' && (
                    <>
                      <div>
                        <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>Quality</label>
                        <select
                          className="w-full text-xs p-2 rounded-lg"
                          style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
                        >
                          <option>Low</option>
                          <option>Medium</option>
                          <option>High</option>
                        </select>
                      </div>
                    </>
                  )}
                  {step.id === 'resize-image' && (
                    <>
                      <div>
                        <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>Width (px)</label>
                        <input
                          type="number"
                          placeholder="1920"
                          className="w-full text-xs p-2 rounded-lg"
                          style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
                        />
                      </div>
                      <div>
                        <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>Height (px)</label>
                        <input
                          type="number"
                          placeholder="1080"
                          className="w-full text-xs p-2 rounded-lg"
                          style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
                        />
                      </div>
                    </>
                  )}
                  {!['compress', 'resize-image'].includes(step.id) && (
                    <p className="text-xs col-span-2" style={{ color: 'var(--text-muted)' }}>
                      No additional settings for this step.
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Connector line */}
      {!isLast && (
        <div className="flex justify-center my-1">
          <div className="flex flex-col items-center gap-0.5">
            <div className="w-0.5 h-3 rounded-full" style={{ background: 'var(--border)' }} />
            <ChevronRight size={12} style={{ color: 'var(--text-muted)', transform: 'rotate(90deg)' }} />
            <div className="w-0.5 h-3 rounded-full" style={{ background: 'var(--border)' }} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function WorkflowBuilder({ onSave, onRun }) {
  const [steps, setSteps] = useState([
    { ...AVAILABLE_STEPS[0], instanceId: 'step-1' },
    { ...AVAILABLE_STEPS[1], instanceId: 'step-2' },
    { ...AVAILABLE_STEPS[9], instanceId: 'step-3' },
  ]);
  const [showPicker, setShowPicker] = useState(false);
  const [workflowName, setWorkflowName] = useState('My Workflow');
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = ['All', ...new Set(AVAILABLE_STEPS.map((s) => s.category))];

  const filteredSteps = activeCategory === 'All'
    ? AVAILABLE_STEPS
    : AVAILABLE_STEPS.filter((s) => s.category === activeCategory);

  const addStep = (step) => {
    setSteps((prev) => [
      ...prev,
      { ...step, instanceId: `step-${Date.now()}` },
    ]);
    setShowPicker(false);
  };

  const removeStep = (instanceId) => {
    setSteps((prev) => prev.filter((s) => s.instanceId !== instanceId));
  };

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Builder Canvas */}
      <div className="lg:col-span-2">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent)', boxShadow: '0 0 15px var(--accent-glow)' }}>
              <GitBranch size={15} color="white" />
            </div>
            <input
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              className="font-display font-bold text-lg bg-transparent border-none outline-none"
              style={{ color: 'var(--text)' }}
            />
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onSave?.({ name: workflowName, steps })}
              className="forge-btn forge-btn-ghost flex items-center gap-1.5 text-sm"
            >
              <Save size={14} /> Save
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onRun?.({ name: workflowName, steps })}
              className="forge-btn forge-btn-primary flex items-center gap-1.5 text-sm"
            >
              <Play size={14} /> Run Workflow
            </motion.button>
          </div>
        </div>

        <div className="p-4 rounded-2xl min-h-[400px]" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}>
          {steps.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Workflow size={40} style={{ color: 'var(--text-muted)' }} className="mb-3" />
              <p className="font-display font-semibold" style={{ color: 'var(--text-secondary)' }}>
                No steps yet
              </p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                Add steps from the panel to build your workflow
              </p>
            </div>
          ) : (
            <Reorder.Group axis="y" values={steps} onReorder={setSteps} className="flex flex-col">
              <AnimatePresence>
                {steps.map((step, i) => (
                  <Reorder.Item key={step.instanceId} value={step}>
                    <WorkflowStep
                      step={step}
                      index={i}
                      onRemove={removeStep}
                      isLast={i === steps.length - 1}
                    />
                  </Reorder.Item>
                ))}
              </AnimatePresence>
            </Reorder.Group>
          )}

          {/* Add step button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowPicker(!showPicker)}
            className="mt-4 w-full py-3 rounded-xl border-2 border-dashed flex items-center justify-center gap-2 transition-all font-display font-semibold text-sm"
            style={{
              borderColor: showPicker ? 'var(--accent)' : 'var(--border)',
              color: showPicker ? 'var(--accent)' : 'var(--text-muted)',
              background: showPicker ? 'var(--accent-subtle)' : 'transparent',
            }}
          >
            <Plus size={16} />
            Add Step
          </motion.button>
        </div>
      </div>

      {/* Step Picker Panel */}
      <div>
        <div className="sticky top-24">
          <div className="forge-card p-4">
            <div className="flex items-center gap-2 mb-4">
              <Zap size={16} style={{ color: 'var(--accent)' }} />
              <h3 className="font-display font-bold text-sm" style={{ color: 'var(--text)' }}>
                Available Steps
              </h3>
            </div>

            {/* Category filter */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: activeCategory === cat ? 'var(--accent)' : 'var(--surface)',
                    color: activeCategory === cat ? 'white' : 'var(--text-secondary)',
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-1.5 max-h-[420px] overflow-y-auto">
              {filteredSteps.map((step, i) => (
                <motion.button
                  key={step.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => addStep(step)}
                  className="flex items-center gap-3 p-3 rounded-xl text-left transition-all w-full group"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                  whileHover={{
                    borderColor: step.color + '50',
                    background: step.color + '08',
                  }}
                >
                  <span className="text-base">{step.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate" style={{ color: 'var(--text)' }}>
                      {step.label}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {step.category}
                    </p>
                  </div>
                  <Plus size={13} style={{ color: step.color, flexShrink: 0 }} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.button>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="forge-card p-3 text-center">
              <p className="font-display font-bold text-2xl" style={{ color: 'var(--accent)' }}>
                {steps.length}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Total Steps</p>
            </div>
            <div className="forge-card p-3 text-center">
              <p className="font-display font-bold text-2xl" style={{ color: 'var(--accent-2)' }}>
                {new Set(steps.map((s) => s.category)).size}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Categories</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
