import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Zap, Building2, ArrowRight, HelpCircle } from 'lucide-react';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: { monthly: 0, annual: 0 },
    description: 'Everything you need to get started — forever free.',
    color: '#6b7280',
    features: [
      '50 files per day',
      'Max 100MB per file',
      'All basic tools',
      'Standard speed',
      'No watermarks on PDF',
      '1GB temporary storage',
    ],
    cta: 'Start Free',
    popular: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: { monthly: 12, annual: 9 },
    description: 'For power users and creative professionals.',
    color: '#f97316',
    features: [
      'Unlimited files per day',
      'Max 2GB per file',
      'All premium tools',
      'Priority processing',
      'Batch operations',
      'Workflow automation',
      'API access (5k req/mo)',
      '50GB cloud storage',
      'Priority support',
    ],
    cta: 'Get Pro',
    popular: true,
    badge: 'Most Popular',
  },
  {
    id: 'team',
    name: 'Team',
    price: { monthly: 39, annual: 29 },
    description: 'For teams that need collaboration and compliance.',
    color: '#8b5cf6',
    features: [
      'Everything in Pro',
      'Up to 10 team members',
      'Shared workflows',
      'API access (50k req/mo)',
      'SSO & SAML auth',
      'Admin dashboard',
      'Audit logs',
      '500GB team storage',
      'SLA guarantee',
      'Dedicated support',
    ],
    cta: 'Get Team',
    popular: false,
  },
];

const FAQ = [
  { q: 'Is the free plan really free forever?', a: 'Yes! Our free plan has no expiry date. You get 50 file operations per day and access to all basic tools with no credit card required.' },
  { q: 'Are my files secure?', a: 'Absolutely. All files are encrypted in transit and at rest. Files on the free plan are automatically deleted after 1 hour. Pro/Team users can manage storage duration.' },
  { q: 'Can I cancel my subscription anytime?', a: 'Yes. Cancel anytime from your account dashboard. You keep Pro access until the end of your billing period with no questions asked.' },
  { q: 'Do you offer a refund?', a: 'We offer a full refund within 14 days of purchase if you\'re not satisfied. Contact support and we\'ll take care of it immediately.' },
  { q: 'What\'s the API rate limit?', a: 'Free users get 100 API requests/month. Pro users get 5,000/month. Team users get 50,000/month. Enterprise plans have custom limits.' },
];

export default function Pricing() {
  const [annual, setAnnual] = useState(true);
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }} className="pt-20">
      <div className="max-w-6xl mx-auto px-4 py-16">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <span
            className="inline-block px-3 py-1 rounded-full text-xs font-display font-bold mb-4"
            style={{ background: 'var(--tag-bg)', color: 'var(--tag-text)' }}
          >
            PRICING
          </span>
          <h1 className="font-display font-black text-5xl mb-4" style={{ color: 'var(--text)' }}>
            Simple, Honest Pricing
          </h1>
          <p className="text-lg mb-8" style={{ color: 'var(--text-secondary)' }}>
            Start free, upgrade when you're ready.
          </p>

          {/* Toggle */}
          <div
            className="inline-flex items-center gap-3 p-1 rounded-full"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <button
              onClick={() => setAnnual(false)}
              className="px-5 py-2 rounded-full text-sm font-display font-semibold transition-all"
              style={{
                background: !annual ? 'var(--accent)' : 'transparent',
                color: !annual ? 'white' : 'var(--text-secondary)',
              }}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className="px-5 py-2 rounded-full text-sm font-display font-semibold transition-all flex items-center gap-2"
              style={{
                background: annual ? 'var(--accent)' : 'transparent',
                color: annual ? 'white' : 'var(--text-secondary)',
              }}
            >
              Annual
              <span
                className="text-xs px-1.5 py-0.5 rounded-full"
                style={{
                  background: annual ? 'rgba(255,255,255,0.2)' : 'var(--tag-bg)',
                  color: annual ? 'white' : 'var(--tag-text)',
                }}
              >
                Save 25%
              </span>
            </button>
          </div>
        </motion.div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`forge-card p-7 flex flex-col relative ${plan.popular ? 'ring-2' : ''}`}
              style={{
                ringColor: plan.popular ? plan.color : undefined,
                borderColor: plan.popular ? `${plan.color}40` : 'var(--border)',
                boxShadow: plan.popular ? `0 0 40px ${plan.color}15, var(--shadow)` : 'var(--shadow)',
              }}
            >
              {plan.badge && (
                <div
                  className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-display font-bold whitespace-nowrap"
                  style={{ background: plan.color, color: 'white' }}
                >
                  {plan.badge}
                </div>
              )}

              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: `${plan.color}15` }}
                  >
                    {plan.id === 'free' && <Zap size={15} style={{ color: plan.color }} />}
                    {plan.id === 'pro' && <Zap size={15} style={{ color: plan.color }} fill={plan.color} />}
                    {plan.id === 'team' && <Building2 size={15} style={{ color: plan.color }} />}
                  </div>
                  <span className="font-display font-bold text-lg" style={{ color: 'var(--text)' }}>
                    {plan.name}
                  </span>
                </div>

                <div className="flex items-baseline gap-1 mb-2">
                  <span className="font-display font-black text-5xl" style={{ color: 'var(--text)' }}>
                    ${annual ? plan.price.annual : plan.price.monthly}
                  </span>
                  {plan.price.monthly > 0 && (
                    <span className="text-sm" style={{ color: 'var(--text-muted)' }}>/mo</span>
                  )}
                </div>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {plan.description}
                </p>
                {plan.price.monthly > 0 && annual && (
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    Billed ${plan.price.annual * 12}/year
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2.5 mb-8 flex-1">
                {plan.features.map((feat) => (
                  <div key={feat} className="flex items-center gap-2.5">
                    <div
                      className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: `${plan.color}20` }}
                    >
                      <Check size={10} style={{ color: plan.color }} strokeWidth={3} />
                    </div>
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {feat}
                    </span>
                  </div>
                ))}
              </div>

              <motion.button
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.97 }}
                className="w-full py-3 rounded-xl font-display font-bold text-sm transition-all flex items-center justify-center gap-2"
                style={
                  plan.popular
                    ? { background: plan.color, color: 'white', boxShadow: `0 8px 25px ${plan.color}40` }
                    : { background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)' }
                }
              >
                {plan.cta}
                <ArrowRight size={15} />
              </motion.button>
            </motion.div>
          ))}
        </div>

        {/* Enterprise */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="forge-card p-8 flex flex-col sm:flex-row items-center gap-6 mb-20"
          style={{ background: 'var(--bg-tertiary)' }}
        >
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--accent-subtle)', border: '1px solid var(--border-accent)' }}>
            <Building2 size={24} style={{ color: 'var(--accent)' }} />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h3 className="font-display font-bold text-xl mb-1" style={{ color: 'var(--text)' }}>
              Enterprise
            </h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              Custom limits, dedicated infrastructure, on-premise deployment, and white-labeling options.
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className="forge-btn forge-btn-primary whitespace-nowrap flex items-center gap-2"
          >
            Contact Sales <ArrowRight size={15} />
          </motion.button>
        </motion.div>

        {/* FAQ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="text-center mb-10">
            <h2 className="font-display font-black text-3xl" style={{ color: 'var(--text)' }}>
              Frequently Asked Questions
            </h2>
          </div>

          <div className="max-w-3xl mx-auto flex flex-col gap-2">
            {FAQ.map((item, i) => (
              <motion.div
                key={i}
                className="forge-card overflow-hidden"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <span className="font-display font-semibold text-sm pr-4" style={{ color: 'var(--text)' }}>
                    {item.q}
                  </span>
                  <motion.div
                    animate={{ rotate: openFaq === i ? 180 : 0 }}
                    style={{ color: 'var(--text-muted)', flexShrink: 0 }}
                  >
                    <HelpCircle size={16} />
                  </motion.div>
                </button>

                {openFaq === i && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="px-5 pb-5"
                  >
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      {item.a}
                    </p>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
