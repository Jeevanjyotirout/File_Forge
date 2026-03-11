import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Palette } from 'lucide-react';

const themes = [
  { id: 'dark', label: 'Dark', color: '#f97316', bg: '#0d0e14', emoji: '🌙' },
  { id: 'light', label: 'Light', color: '#ea580c', bg: '#fafaf8', emoji: '☀️' },
  { id: 'glass', label: 'Glass', color: '#38bdf8', bg: '#0a0f1e', emoji: '💎' },
  { id: 'gradient', label: 'Gradient', color: '#ec4899', bg: '#0e0520', emoji: '🌈' },
  { id: 'cyberpunk', label: 'Cyber', color: '#00ffaa', bg: '#020408', emoji: '⚡' },
];

export default function ThemeSwitcher({ currentTheme, onThemeChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const active = themes.find((t) => t.id === currentTheme) || themes[0];

  return (
    <div ref={ref} className="relative">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all"
        style={{
          background: 'var(--accent-subtle)',
          color: 'var(--accent)',
          border: '1px solid var(--border-accent)',
        }}
      >
        <Palette size={15} />
        <span className="hidden sm:inline font-display font-semibold">{active.label}</span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 8 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 mt-2 p-2 rounded-2xl shadow-xl z-50 min-w-[180px]"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow)',
            }}
          >
            <p className="text-xs font-display font-semibold px-2 py-1 mb-1" style={{ color: 'var(--text-muted)' }}>
              CHOOSE THEME
            </p>
            {themes.map((theme, i) => (
              <motion.button
                key={theme.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => {
                  onThemeChange?.(theme.id);
                  setOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left"
                style={{
                  background: currentTheme === theme.id ? 'var(--accent-subtle)' : 'transparent',
                  color: currentTheme === theme.id ? 'var(--accent)' : 'var(--text-secondary)',
                }}
              >
                <div
                  className="w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center text-xs"
                  style={{ background: theme.bg, border: `1px solid ${theme.color}40` }}
                >
                  {theme.emoji}
                </div>
                <span className="font-body font-medium text-sm">{theme.label}</span>
                {currentTheme === theme.id && (
                  <motion.div
                    layoutId="theme-check"
                    className="ml-auto w-1.5 h-1.5 rounded-full"
                    style={{ background: 'var(--accent)' }}
                  />
                )}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
