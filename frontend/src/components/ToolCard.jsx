import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, Zap } from 'lucide-react';

export default function ToolCard({ tool, index = 0 }) {
  const {
    id,
    name,
    description,
    icon: Icon,
    color = 'var(--accent)',
    category,
    badge,
    popular = false,
    href = `/tools/${id}`,
  } = tool;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{
        duration: 0.5,
        delay: index * 0.07,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <Link to={href} className="block h-full">
        <motion.div
          className="forge-card h-full group p-5 cursor-pointer"
          whileHover={{ y: -4, scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          style={{ boxShadow: 'var(--shadow)' }}
        >
          {/* Top row: icon + badge */}
          <div className="flex items-start justify-between mb-4">
            <motion.div
              className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{
                background: `${color}15`,
                border: `1px solid ${color}30`,
              }}
              whileHover={{ rotate: 8, scale: 1.1 }}
              transition={{ type: 'spring', stiffness: 400 }}
            >
              {Icon && <Icon size={22} style={{ color }} />}
            </motion.div>

            <div className="flex items-center gap-2">
              {popular && (
                <span
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-display font-bold"
                  style={{ background: 'var(--tag-bg)', color: 'var(--tag-text)' }}
                >
                  <Star size={10} fill="currentColor" />
                  Popular
                </span>
              )}
              {badge && (
                <span
                  className="px-2 py-0.5 rounded-full text-xs font-display font-bold"
                  style={{ background: `${color}15`, color }}
                >
                  {badge}
                </span>
              )}
            </div>
          </div>

          {/* Name & description */}
          <div className="mb-4">
            <h3
              className="font-display font-bold text-base mb-1.5 group-hover:text-[var(--accent)] transition-colors"
              style={{ color: 'var(--text)' }}
            >
              {name}
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {description}
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-auto pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
            <span
              className="text-xs font-display font-semibold px-2 py-1 rounded-lg"
              style={{ background: 'var(--surface)', color: 'var(--text-muted)' }}
            >
              {category}
            </span>
            <motion.div
              className="flex items-center gap-1 text-xs font-semibold"
              style={{ color: 'var(--accent)' }}
              whileHover={{ x: 3 }}
            >
              Use tool
              <ArrowRight size={13} />
            </motion.div>
          </div>

          {/* Hover glow effect */}
          <motion.div
            className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300"
            style={{
              background: `radial-gradient(ellipse at top left, ${color}06, transparent 60%)`,
            }}
          />
        </motion.div>
      </Link>
    </motion.div>
  );
}
