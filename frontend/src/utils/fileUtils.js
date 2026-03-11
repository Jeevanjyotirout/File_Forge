// ── File Type Utilities ───────────────────

export const FILE_TYPES = {
  PDF: 'application/pdf',
  WORD: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  WORD_OLD: 'application/msword',
  EXCEL: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  POWERPOINT: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  IMAGE_JPEG: 'image/jpeg',
  IMAGE_PNG: 'image/png',
  IMAGE_GIF: 'image/gif',
  IMAGE_WEBP: 'image/webp',
  IMAGE_SVG: 'image/svg+xml',
  TEXT: 'text/plain',
  CSV: 'text/csv',
  ZIP: 'application/zip',
};

export const MIME_TO_EXT = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'text/plain': 'txt',
  'text/csv': 'csv',
  'application/zip': 'zip',
};

export const FILE_COLORS = {
  pdf: '#ef4444',
  docx: '#3b82f6',
  doc: '#3b82f6',
  xlsx: '#22c55e',
  xls: '#22c55e',
  pptx: '#f97316',
  ppt: '#f97316',
  jpg: '#a855f7',
  jpeg: '#a855f7',
  png: '#06b6d4',
  gif: '#ec4899',
  webp: '#14b8a6',
  svg: '#f59e0b',
  txt: '#6b7280',
  csv: '#84cc16',
  zip: '#8b5cf6',
};

export const FILE_ICONS = {
  pdf: '📄',
  docx: '📝',
  doc: '📝',
  xlsx: '📊',
  xls: '📊',
  pptx: '📊',
  ppt: '📊',
  jpg: '🖼️',
  jpeg: '🖼️',
  png: '🖼️',
  gif: '🎞️',
  webp: '🖼️',
  svg: '🎨',
  txt: '📃',
  csv: '📋',
  zip: '🗜️',
};

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

export const getFileExtension = (filename) => {
  return filename.split('.').pop().toLowerCase();
};

export const getFileColor = (filename) => {
  const ext = getFileExtension(filename);
  return FILE_COLORS[ext] || '#6b7280';
};

export const getFileIcon = (filename) => {
  const ext = getFileExtension(filename);
  return FILE_ICONS[ext] || '📁';
};

export const isImageFile = (file) => {
  return file.type.startsWith('image/');
};

export const isPDFFile = (file) => {
  return file.type === FILE_TYPES.PDF;
};

export const truncateFilename = (filename, maxLength = 25) => {
  if (filename.length <= maxLength) return filename;
  const ext = getFileExtension(filename);
  const nameWithoutExt = filename.slice(0, filename.lastIndexOf('.'));
  const truncated = nameWithoutExt.slice(0, maxLength - ext.length - 4);
  return `${truncated}...${ext}`;
};

export const generateFileId = () => {
  return `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const createFilePreviewUrl = (file) => {
  return URL.createObjectURL(file);
};

export const revokeFilePreviewUrl = (url) => {
  URL.revokeObjectURL(url);
};

export const validateFileType = (file, allowedTypes) => {
  return allowedTypes.includes(file.type);
};

export const validateFileSize = (file, maxSizeMB) => {
  return file.size <= maxSizeMB * 1024 * 1024;
};

export const validateFiles = (files, options = {}) => {
  const {
    allowedTypes = null,
    maxSizeMB = 100,
    maxFiles = 10,
  } = options;

  const errors = [];
  const validFiles = [];

  if (files.length > maxFiles) {
    errors.push(`Maximum ${maxFiles} files allowed`);
    return { validFiles, errors };
  }

  files.forEach((file) => {
    if (allowedTypes && !validateFileType(file, allowedTypes)) {
      errors.push(`${file.name}: File type not supported`);
      return;
    }
    if (!validateFileSize(file, maxSizeMB)) {
      errors.push(`${file.name}: File exceeds ${maxSizeMB}MB limit`);
      return;
    }
    validFiles.push(file);
  });

  return { validFiles, errors };
};

export const sortFiles = (files, sortBy = 'name') => {
  return [...files].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'size':
        return a.size - b.size;
      case 'type':
        return a.type.localeCompare(b.type);
      case 'date':
        return b.lastModified - a.lastModified;
      default:
        return 0;
    }
  });
};

export const groupFilesByType = (files) => {
  return files.reduce((groups, file) => {
    const ext = getFileExtension(file.name);
    if (!groups[ext]) groups[ext] = [];
    groups[ext].push(file);
    return groups;
  }, {});
};

export const estimateProcessingTime = (files, tool) => {
  const totalSize = files.reduce((sum, f) => sum + f.size, 0);
  const mbSize = totalSize / (1024 * 1024);

  const speeds = {
    compress: 5,
    convert: 3,
    merge: 8,
    split: 10,
    default: 5,
  };

  const speed = speeds[tool] || speeds.default;
  return Math.max(1, Math.ceil(mbSize / speed));
};
