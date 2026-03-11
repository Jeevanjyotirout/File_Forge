import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from './components/Navbar';
import ThemeSwitcher from './components/ThemeSwitcher';
import Notification from './components/Notification';
import Home from './pages/Home';
import Tools from './pages/Tools';
import Workflow from './pages/Workflow';
import Pricing from './pages/Pricing';

function PageWrapper({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('ff_theme') || 'dark');
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('ff_theme', theme);
  }, [theme]);

  const dismissNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // Expose global notification function
  useEffect(() => {
    window.notify = (notif) => {
      const id = Date.now().toString();
      setNotifications((prev) => [...prev, { id, ...notif }]);
    };
    return () => { delete window.notify; };
  }, []);

  return (
    <BrowserRouter>
      {/* Navbar gets theme control */}
      <NavbarWithTheme theme={theme} onThemeChange={setTheme} />

      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<PageWrapper><Home /></PageWrapper>} />
          <Route path="/tools" element={<PageWrapper><Tools /></PageWrapper>} />
          <Route path="/tools/:toolId" element={<PageWrapper><Tools /></PageWrapper>} />
          <Route path="/workflow" element={<PageWrapper><Workflow /></PageWrapper>} />
          <Route path="/pricing" element={<PageWrapper><Pricing /></PageWrapper>} />
          <Route path="*" element={<PageWrapper><NotFound /></PageWrapper>} />
        </Routes>
      </AnimatePresence>

      <Notification notifications={notifications} onDismiss={dismissNotification} />
    </BrowserRouter>
  );
}

// Wrapper that injects ThemeSwitcher into Navbar
function NavbarWithTheme({ theme, onThemeChange }) {
  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
      style={{ borderBottom: '1px solid transparent' }}
      id="main-navbar"
    >
      <NavbarInner theme={theme} onThemeChange={onThemeChange} />
    </nav>
  );
}

import { useState as useNavState, useEffect as useNavEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Zap, Menu, X } from 'lucide-react';

const navLinks = [
  { label: 'Tools', href: '/tools' },
  { label: 'Workflow', href: '/workflow' },
  { label: 'Pricing', href: '/pricing' },
];

function NavbarInner({ theme, onThemeChange }) {
  const [scrolled, setScrolled] = useNavState(false);
  const [mobileOpen, setMobileOpen] = useNavState(false);
  const location = useLocation();

  useNavEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useNavEffect(() => setMobileOpen(false), [location]);

  return (
    <motion.div
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      style={{
        background: scrolled ? 'var(--navbar-bg)' : 'transparent',
        borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'none',
      }}
      className="transition-all duration-500"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <motion.div
              whileHover={{ rotate: 15, scale: 1.1 }}
              transition={{ type: 'spring', stiffness: 400 }}
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--accent)', boxShadow: '0 0 20px var(--accent-glow)' }}
            >
              <Zap size={16} color="white" fill="white" />
            </motion.div>
            <span className="font-display font-bold text-xl" style={{ color: 'var(--text)' }}>
              File<span style={{ color: 'var(--accent)' }}>Forge</span>
            </span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.href;
              return (
                <Link key={link.href} to={link.href}>
                  <motion.div
                    whileHover={{ y: -1 }}
                    className="relative px-4 py-2 rounded-lg font-body text-sm font-medium transition-colors"
                    style={{ color: isActive ? 'var(--accent)' : 'var(--text-secondary)' }}
                  >
                    {link.label}
                    {isActive && (
                      <motion.div
                        layoutId="nav-indicator"
                        className="absolute inset-0 rounded-lg"
                        style={{ background: 'var(--accent-subtle)' }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                  </motion.div>
                </Link>
              );
            })}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <ThemeSwitcher currentTheme={theme} onThemeChange={onThemeChange} />
            <Link to="/pricing">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="hidden sm:block forge-btn forge-btn-primary text-sm"
              >
                Get Started Free
              </motion.button>
            </Link>

            <button
              className="md:hidden p-2 rounded-lg transition-colors"
              style={{ color: 'var(--text)', background: 'var(--accent-subtle)' }}
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            style={{ background: 'var(--navbar-bg)', borderBottom: '1px solid var(--border)' }}
            className="overflow-hidden md:hidden"
          >
            <div className="px-4 py-4 flex flex-col gap-1">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07 }}
                >
                  <Link
                    to={link.href}
                    className="block px-4 py-3 rounded-xl font-body font-medium transition-colors"
                    style={{
                      color: location.pathname === link.href ? 'var(--accent)' : 'var(--text-secondary)',
                      background: location.pathname === link.href ? 'var(--accent-subtle)' : 'transparent',
                    }}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function NotFound() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center text-center px-4"
      style={{ background: 'var(--bg)' }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200 }}
      >
        <div className="text-8xl mb-6">🔧</div>
        <h1 className="font-display font-black text-6xl mb-4 gradient-text">404</h1>
        <p className="text-xl mb-8" style={{ color: 'var(--text-secondary)' }}>
          This page got lost in the forge.
        </p>
        <Link to="/">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="forge-btn forge-btn-primary inline-flex items-center gap-2"
          >
            <Zap size={16} />
            Back to Home
          </motion.button>
        </Link>
      </motion.div>
    </div>
  );
}
