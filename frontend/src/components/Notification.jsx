import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const ICONS = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

const COLORS = {
  success: { bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.25)', icon: '#22c55e', text: '#22c55e' },
  error: { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.25)', icon: '#ef4444', text: '#ef4444' },
  info: { bg: 'var(--accent-subtle)', border: 'var(--border-accent)', icon: 'var(--accent)', text: 'var(--accent)' },
  warning: { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)', icon: '#f59e0b', text: '#f59e0b' },
};

function NotificationItem({ notification, onDismiss }) {
  const { id, type = 'info', title, message, duration = 4000 } = notification;
  const Icon = ICONS[type];
  const colors = COLORS[type];

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => onDismiss(id), duration);
      return () => clearTimeout(timer);
    }
  }, [id, duration, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 60, scale: 0.85 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.85 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      className="flex items-start gap-3 p-4 rounded-2xl max-w-sm w-full shadow-xl"
      style={{
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        backdropFilter: 'blur(12px)',
      }}
    >
      <Icon size={18} style={{ color: colors.icon, flexShrink: 0, marginTop: 1 }} />
      <div className="flex-1 min-w-0">
        {title && (
          <p className="font-display font-bold text-sm mb-0.5" style={{ color: 'var(--text)' }}>
            {title}
          </p>
        )}
        {message && (
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {message}
          </p>
        )}
        {/* Progress bar */}
        {duration > 0 && (
          <motion.div
            className="mt-2 h-0.5 rounded-full origin-left"
            style={{ background: colors.icon }}
            initial={{ scaleX: 1 }}
            animate={{ scaleX: 0 }}
            transition={{ duration: duration / 1000, ease: 'linear' }}
          />
        )}
      </div>
      <button
        onClick={() => onDismiss(id)}
        className="p-1 rounded-lg transition-colors flex-shrink-0"
        style={{ color: 'var(--text-muted)' }}
      >
        <X size={14} />
      </button>
    </motion.div>
  );
}

export default function Notification({ notifications = [], onDismiss }) {
  return (
    <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {notifications.map((notif) => (
          <div key={notif.id} className="pointer-events-auto">
            <NotificationItem notification={notif} onDismiss={onDismiss} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// Hook for managing notifications
export function useNotifications() {
  const [notifications, setNotifications] = useState([]);

  const push = (notif) => {
    const id = Date.now().toString();
    setNotifications((prev) => [...prev, { id, ...notif }]);
    return id;
  };

  const dismiss = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const success = (title, message) => push({ type: 'success', title, message });
  const error = (title, message) => push({ type: 'error', title, message, duration: 6000 });
  const info = (title, message) => push({ type: 'info', title, message });
  const warning = (title, message) => push({ type: 'warning', title, message });

  return { notifications, dismiss, push, success, error, info, warning };
}

import { useState } from 'react';
