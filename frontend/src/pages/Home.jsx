import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Zap, Shield, Clock, Users,
  FileText, Image, GitMerge, Scissors, Download,
  Star, ChevronDown, Play, Globe
} from 'lucide-react';
import UploadZone from '../components/UploadZone';
import ToolCard from '../components/ToolCard';

const HERO_TOOLS = [
  { id: 'merge-pdf', name: 'Merge PDF', description: 'Combine multiple PDFs into one seamless document', icon: GitMerge, color: '#8b5cf6', category: 'PDF', popular: true },
  { id: 'compress-pdf', name: 'Compress PDF', description: 'Reduce file size while maintaining quality', icon: Zap, color: '#f97316', category: 'PDF', popular: true },
  { id: 'pdf-to-word', name: 'PDF to Word', description: 'Convert PDF documents to editable Word files', icon: FileText, color: '#3b82f6', category: 'Convert', badge: 'Fast' },
  { id: 'compress-image', name: 'Compress Image', description: 'Shrink image sizes without visible quality loss', icon: Image, color: '#22c55e', category: 'Image', popular: true },
  { id: 'split-pdf', name: 'Split PDF', description: 'Extract pages or split documents at any point', icon: Scissors, color: '#ec4899', category: 'PDF' },
  { id: 'convert-image', name: 'Convert Image', description: 'Transform images between all major formats', icon: Image, color: '#06b6d4', category: 'Image', badge: 'New' },
];

const STATS = [
  { value: '50M+', label: 'Files Processed', icon: '📁' },
  { value: '2M+', label: 'Happy Users', icon: '🧑‍💻' },
  { value: '99.9%', label: 'Uptime', icon: '⚡' },
  { value: '<1s', label: 'Avg Processing', icon: '🚀' },
];

const FEATURES = [
  { icon: Shield, title: 'Privacy First', desc: 'Files auto-deleted after 1 hour. We never read your data.', color: '#22c55e' },
  { icon: Zap, title: 'Lightning Fast', desc: 'Parallel processing delivers results in under a second.', color: '#f97316' },
  { icon: Globe, title: 'Works Everywhere', desc: 'Browser-based — no install required. Works on any device.', color: '#3b82f6' },
  { icon: GitMerge, title: 'Batch & Workflow', desc: 'Process hundreds of files at once with custom workflows.', color: '#8b5cf6' },
];

const TESTIMONIALS = [
  { name: 'Sarah K.', role: 'Marketing Manager', text: "FileForge cut our PDF workflow from 30 minutes to 2. Absolutely essential.", avatar: '👩‍💼' },
  { name: 'James R.', role: 'Developer', text: "The API is clean, the speed is insane. Best file processing tool out there.", avatar: '👨‍💻' },
  { name: 'Maria T.', role: 'Designer', text: "Image compression without quality loss? Witchcraft. I love it.", avatar: '👩‍🎨' },
];

export default function Home() {
  const [files, setFiles] = useState([]);

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
  };

  return (
    <div style={{ background: 'var(--bg)' }} className="min-h-screen">
      {/* ── HERO ─────────────────────────────── */}
      <section
        className="relative min-h-screen flex flex-col items-center justify-center pt-24 pb-16 px-4 overflow-hidden"
        style={{ background: 'var(--gradient-hero)' }}
      >
        {/* Ambient orbs */}
        <div
          className="absolute top-1/4 -left-32 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: 'var(--accent)', opacity: 0.06, filter: 'blur(80px)', animation: 'float 8s ease-in-out infinite' }}
        />
        <div
          className="absolute bottom-1/4 -right-32 w-80 h-80 rounded-full pointer-events-none"
          style={{ background: 'var(--accent-2)', opacity: 0.05, filter: 'blur(80px)', animation: 'float 10s ease-in-out infinite reverse' }}
        />

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="text-center max-w-4xl mx-auto relative z-10"
        >
          {/* Badge */}
          <motion.div variants={itemVariants} className="flex justify-center mb-6">
            <span
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-display font-semibold"
              style={{ background: 'var(--tag-bg)', color: 'var(--tag-text)', border: '1px solid var(--border-accent)' }}
            >
              <Zap size={13} fill="currentColor" />
              50+ File Processing Tools — All Free
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={itemVariants}
            className="font-display font-black text-5xl sm:text-6xl lg:text-7xl leading-[0.95] mb-6"
            style={{ color: 'var(--text)' }}
          >
            Forge Your Files
            <br />
            <span className="gradient-text">Into Anything.</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            variants={itemVariants}
            className="text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
            style={{ color: 'var(--text-secondary)' }}
          >
            The all-in-one file processing platform. Merge, compress, convert, and
            transform PDFs, images, and documents in seconds — no software needed.
          </motion.p>

          {/* CTAs */}
          <motion.div variants={itemVariants} className="flex flex-wrap items-center justify-center gap-4 mb-16">
            <Link to="/tools">
              <motion.button
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.97 }}
                className="forge-btn forge-btn-primary flex items-center gap-2 text-base px-8 py-4"
                style={{ boxShadow: 'var(--shadow-accent)' }}
              >
                <Zap size={18} />
                Start Processing Free
                <ArrowRight size={16} />
              </motion.button>
            </Link>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="forge-btn forge-btn-ghost flex items-center gap-2 text-base px-7 py-4"
            >
              <Play size={16} />
              Watch Demo
            </motion.button>
          </motion.div>

          {/* Upload Zone */}
          <motion.div variants={itemVariants} className="max-w-xl mx-auto">
            <UploadZone
              onFilesAccepted={setFiles}
              compact
            />
            {files.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4"
              >
                <Link to="/tools">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    className="forge-btn forge-btn-primary w-full flex items-center justify-center gap-2"
                  >
                    Choose what to do with {files.length} file{files.length > 1 ? 's' : ''}
                    <ArrowRight size={16} />
                  </motion.button>
                </Link>
              </motion.div>
            )}
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          style={{ color: 'var(--text-muted)' }}
        >
          <ChevronDown size={22} />
        </motion.div>
      </section>

      {/* ── STATS ─────────────────────────────── */}
      <section className="py-16 px-4" style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-5xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-8">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <div className="text-3xl mb-2">{stat.icon}</div>
              <div className="font-display font-black text-3xl mb-1 gradient-text">{stat.value}</div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── TOOLS GRID ───────────────────────── */}
      <section className="py-24 px-4 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span className="inline-block px-3 py-1 rounded-full text-xs font-display font-bold mb-4" style={{ background: 'var(--tag-bg)', color: 'var(--tag-text)' }}>
            MOST POPULAR
          </span>
          <h2 className="font-display font-black text-4xl sm:text-5xl mb-4" style={{ color: 'var(--text)' }}>
            Every Tool You Need
          </h2>
          <p className="text-lg max-w-xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
            From quick file conversions to complex batch workflows — FileForge has you covered.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
          {HERO_TOOLS.map((tool, i) => (
            <ToolCard key={tool.id} tool={tool} index={i} />
          ))}
        </div>

        <div className="text-center">
          <Link to="/tools">
            <motion.button
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.97 }}
              className="forge-btn forge-btn-ghost inline-flex items-center gap-2"
            >
              View all 50+ tools
              <ArrowRight size={16} />
            </motion.button>
          </Link>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────── */}
      <section className="py-24 px-4" style={{ background: 'var(--bg-secondary)' }}>
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="font-display font-black text-4xl mb-4" style={{ color: 'var(--text)' }}>
              Built Different
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="forge-card p-6"
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: `${f.color}15`, border: `1px solid ${f.color}30` }}
                >
                  <f.icon size={22} style={{ color: f.color }} />
                </div>
                <h3 className="font-display font-bold text-base mb-2" style={{ color: 'var(--text)' }}>
                  {f.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {f.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────── */}
      <section className="py-24 px-4 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <div className="flex justify-center mb-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={20} style={{ color: '#f59e0b' }} fill="#f59e0b" />
            ))}
          </div>
          <h2 className="font-display font-black text-4xl" style={{ color: 'var(--text)' }}>
            Trusted by Millions
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="forge-card p-6"
            >
              <div className="flex items-center gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} size={13} style={{ color: '#f59e0b' }} fill="#f59e0b" />
                ))}
              </div>
              <p className="text-sm leading-relaxed mb-5 italic" style={{ color: 'var(--text-secondary)' }}>
                "{t.text}"
              </p>
              <div className="flex items-center gap-3">
                <div className="text-2xl">{t.avatar}</div>
                <div>
                  <p className="font-display font-bold text-sm" style={{ color: 'var(--text)' }}>{t.name}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA ──────────────────────────────── */}
      <section className="py-24 px-4" style={{ background: 'var(--bg-secondary)' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center rounded-3xl p-12 relative overflow-hidden"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border-accent)',
            boxShadow: 'var(--shadow-accent)',
          }}
        >
          <div className="absolute inset-0 pointer-events-none" style={{
            background: 'radial-gradient(ellipse at center, var(--accent-subtle) 0%, transparent 70%)',
          }} />
          <div className="relative z-10">
            <h2 className="font-display font-black text-4xl mb-4" style={{ color: 'var(--text)' }}>
              Start Forging for Free
            </h2>
            <p className="text-lg mb-8" style={{ color: 'var(--text-secondary)' }}>
              No account needed. Just upload and transform.
            </p>
            <Link to="/tools">
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.97 }}
                className="forge-btn forge-btn-primary inline-flex items-center gap-2 text-base px-10 py-4"
                style={{ boxShadow: 'var(--shadow-accent)' }}
              >
                <Zap size={18} />
                Get Started Now
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-4 text-center" style={{ borderTop: '1px solid var(--border)' }}>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          © 2025 FileForge · Built with ⚡ for creators and professionals
        </p>
      </footer>
    </div>
  );
}
