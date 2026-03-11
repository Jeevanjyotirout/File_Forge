import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, FileText, Image, Zap, GitMerge, Scissors,
  RotateCw, Shield, Type, Archive, Globe, Eye,
  Code, Hash, SlidersHorizontal, X
} from 'lucide-react';
import ToolCard from '../components/ToolCard';

const ALL_TOOLS = [
  // PDF
  { id: 'merge-pdf', name: 'Merge PDF', description: 'Combine multiple PDF files into a single document in the order you want.', icon: GitMerge, color: '#8b5cf6', category: 'PDF', popular: true },
  { id: 'split-pdf', name: 'Split PDF', description: 'Separate a PDF into multiple individual files or extract specific pages.', icon: Scissors, color: '#ec4899', category: 'PDF' },
  { id: 'compress-pdf', name: 'Compress PDF', description: 'Reduce PDF file size significantly while retaining high quality.', icon: Zap, color: '#f97316', category: 'PDF', popular: true },
  { id: 'pdf-to-word', name: 'PDF to Word', description: 'Convert PDF to fully editable DOCX format with formatting preserved.', icon: FileText, color: '#3b82f6', category: 'PDF', badge: 'Fast', popular: true },
  { id: 'word-to-pdf', name: 'Word to PDF', description: 'Turn DOCX files into professional PDF documents instantly.', icon: FileText, color: '#ef4444', category: 'PDF' },
  { id: 'rotate-pdf', name: 'Rotate PDF', description: 'Rotate all or selected pages in your PDF to the correct orientation.', icon: RotateCw, color: '#06b6d4', category: 'PDF' },
  { id: 'watermark-pdf', name: 'Watermark PDF', description: 'Add custom text or image watermarks to your PDF documents.', icon: Shield, color: '#14b8a6', category: 'PDF' },
  { id: 'protect-pdf', name: 'Protect PDF', description: 'Add password protection and set permissions on your PDF files.', icon: Shield, color: '#22c55e', category: 'PDF' },
  { id: 'unlock-pdf', name: 'Unlock PDF', description: 'Remove password protection from PDF files you have access to.', icon: Shield, color: '#f59e0b', category: 'PDF' },
  { id: 'extract-pages', name: 'Extract Pages', description: 'Pull out specific pages from a PDF into a new document.', icon: FileText, color: '#6366f1', category: 'PDF' },
  // Image
  { id: 'compress-image', name: 'Compress Image', description: 'Reduce image file sizes without visible quality loss using smart compression.', icon: Image, color: '#22c55e', category: 'Image', popular: true },
  { id: 'resize-image', name: 'Resize Image', description: 'Change image dimensions precisely with aspect ratio control.', icon: Image, color: '#3b82f6', category: 'Image' },
  { id: 'convert-image', name: 'Convert Image', description: 'Convert between JPG, PNG, WEBP, GIF, BMP, and SVG formats.', icon: Image, color: '#06b6d4', category: 'Image', badge: 'New' },
  { id: 'crop-image', name: 'Crop Image', description: 'Crop images to specific dimensions or aspect ratios easily.', icon: Scissors, color: '#ec4899', category: 'Image' },
  { id: 'image-to-pdf', name: 'Image to PDF', description: 'Convert single or multiple images into a PDF document.', icon: Image, color: '#f97316', category: 'Image' },
  // Convert
  { id: 'pdf-to-jpg', name: 'PDF to JPG', description: 'Extract all pages from a PDF as high-quality JPG images.', icon: Image, color: '#f59e0b', category: 'Convert' },
  { id: 'excel-to-pdf', name: 'Excel to PDF', description: 'Convert spreadsheets to PDF while preserving all formatting.', icon: FileText, color: '#22c55e', category: 'Convert' },
  { id: 'ppt-to-pdf', name: 'PPT to PDF', description: 'Turn PowerPoint presentations into universally-viewable PDFs.', icon: FileText, color: '#ef4444', category: 'Convert' },
  { id: 'html-to-pdf', name: 'HTML to PDF', description: 'Convert any web page or HTML file to a clean PDF document.', icon: Globe, color: '#8b5cf6', category: 'Convert' },
  // Utility
  { id: 'ocr-pdf', name: 'OCR PDF', description: 'Extract text from scanned PDFs and images using AI-powered OCR.', icon: Eye, color: '#14b8a6', category: 'Utility', badge: 'AI' },
  { id: 'pdf-metadata', name: 'Edit Metadata', description: 'View and edit PDF metadata: title, author, keywords, and more.', icon: Hash, color: '#6366f1', category: 'Utility' },
  { id: 'zip-files', name: 'Zip Files', description: 'Compress multiple files into a single ZIP archive for easy sharing.', icon: Archive, color: '#f97316', category: 'Utility' },
  { id: 'base64', name: 'Base64 Encode', description: 'Encode files to Base64 or decode Base64 strings back to files.', icon: Code, color: '#22c55e', category: 'Utility' },
];

const CATEGORIES = ['All', 'PDF', 'Image', 'Convert', 'Utility'];

export default function Tools() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [showPopularOnly, setShowPopularOnly] = useState(false);

  const filtered = useMemo(() => {
    return ALL_TOOLS.filter((tool) => {
      const matchesSearch = !search ||
        tool.name.toLowerCase().includes(search.toLowerCase()) ||
        tool.description.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = activeCategory === 'All' || tool.category === activeCategory;
      const matchesPopular = !showPopularOnly || tool.popular;
      return matchesSearch && matchesCategory && matchesPopular;
    });
  }, [search, activeCategory, showPopularOnly]);

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }} className="pt-20">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <span
            className="inline-block px-3 py-1 rounded-full text-xs font-display font-bold mb-4"
            style={{ background: 'var(--tag-bg)', color: 'var(--tag-text)' }}
          >
            ALL TOOLS
          </span>
          <h1 className="font-display font-black text-4xl sm:text-5xl mb-3" style={{ color: 'var(--text)' }}>
            50+ Powerful Tools
          </h1>
          <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
            Everything you need to work with files — free, fast, and private.
          </p>
        </motion.div>

        {/* Search & Filters */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-4 mb-8"
        >
          {/* Search box */}
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--text-muted)' }}
            />
            <input
              type="text"
              placeholder="Search tools..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-10 py-3 rounded-xl text-sm outline-none transition-all"
              style={{
                background: 'var(--input-bg)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--border-accent)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg"
                style={{ color: 'var(--text-muted)' }}
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Popular toggle */}
          <button
            onClick={() => setShowPopularOnly(!showPopularOnly)}
            className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap"
            style={{
              background: showPopularOnly ? 'var(--accent)' : 'var(--input-bg)',
              border: `1px solid ${showPopularOnly ? 'var(--accent)' : 'var(--border)'}`,
              color: showPopularOnly ? 'white' : 'var(--text-secondary)',
            }}
          >
            <SlidersHorizontal size={15} />
            Popular Only
          </button>
        </motion.div>

        {/* Category tabs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="flex items-center gap-2 flex-wrap mb-10"
        >
          {CATEGORIES.map((cat) => (
            <motion.button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}
              className="px-5 py-2 rounded-full text-sm font-display font-semibold transition-all"
              style={{
                background: activeCategory === cat ? 'var(--accent)' : 'var(--surface)',
                color: activeCategory === cat ? 'white' : 'var(--text-secondary)',
                border: `1px solid ${activeCategory === cat ? 'transparent' : 'var(--border)'}`,
                boxShadow: activeCategory === cat ? 'var(--shadow-accent)' : 'none',
              }}
            >
              {cat}
              <span
                className="ml-2 px-1.5 py-0.5 rounded-md text-xs"
                style={{
                  background: activeCategory === cat ? 'rgba(255,255,255,0.2)' : 'var(--bg-tertiary)',
                  color: activeCategory === cat ? 'white' : 'var(--text-muted)',
                }}
              >
                {cat === 'All' ? ALL_TOOLS.length : ALL_TOOLS.filter((t) => t.category === cat).length}
              </span>
            </motion.button>
          ))}
        </motion.div>

        {/* Results count */}
        <AnimatePresence mode="wait">
          <motion.p
            key={`${activeCategory}-${search}-${showPopularOnly}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm mb-6"
            style={{ color: 'var(--text-muted)' }}
          >
            {filtered.length === 0
              ? 'No tools found'
              : `Showing ${filtered.length} tool${filtered.length !== 1 ? 's' : ''}`}
            {search && ` for "${search}"`}
          </motion.p>
        </AnimatePresence>

        {/* Tools Grid */}
        <AnimatePresence mode="wait">
          {filtered.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-24 text-center"
            >
              <div className="text-5xl mb-4">🔍</div>
              <p className="font-display font-bold text-xl mb-2" style={{ color: 'var(--text)' }}>
                No tools found
              </p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Try adjusting your search or filters
              </p>
              <button
                onClick={() => { setSearch(''); setActiveCategory('All'); setShowPopularOnly(false); }}
                className="mt-4 forge-btn forge-btn-ghost text-sm"
              >
                Clear filters
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="grid"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            >
              {filtered.map((tool, i) => (
                <ToolCard key={tool.id} tool={tool} index={i} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
