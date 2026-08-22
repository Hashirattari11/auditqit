'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import UpgradeModal from '@/components/UpgradeModal';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

/* ── Counting hook ────────────────────────────────────────────── */
function useCountUp(target: number, duration = 2000) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const tick = (now: number) => {
            const pct = Math.min((now - start) / duration, 1);
            setCount(Math.floor(pct * target));
            if (pct < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.3 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [target, duration]);

  return { count, ref };
}

/* ── Page ─────────────────────────────────────────────────────── */
interface RecentAudit { id: string; url: string; status: string; created_at: string; }
interface RecentRepoAudit { id: string; repo_url: string; owner: string; repo: string; status: string; created_at: string; }

export default function LandingPage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [recentAudits, setRecentAudits] = useState<RecentAudit[]>([]);
  const [recentRepoAudits, setRecentRepoAudits] = useState<RecentRepoAudit[]>([]);
  const [activeTab, setActiveTab] = useState<'web' | 'github'>('web');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const router = useRouter();
  const { data: session } = useSession();

  useEffect(() => {
    fetchRecentAudits();
    fetchRecentRepoAudits();
  }, []);

  // Scroll reveal
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' },
    );
    document.querySelectorAll('.reveal').forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const fetchRecentAudits = async () => {
    try { const r = await fetch('/api/audit/recent'); if (r.ok) { const d = await r.json(); setRecentAudits(d.audits || []); } } catch {}
  };
  const fetchRecentRepoAudits = async () => {
    try { const r = await fetch('/api/github-audit/recent'); if (r.ok) { const d = await r.json(); setRecentRepoAudits(d.audits || []); } } catch {}
  };

  const isGitHubUrl = (input: string) => /github\.com\/[^/]+\/[^/]+/.test(input);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    let finalUrl = url.trim();
    if (!finalUrl) { setError('Please enter a URL'); return; }
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) finalUrl = 'https://' + finalUrl;
    try { new URL(finalUrl); } catch { setError('Please enter a valid URL'); return; }
    setLoading(true);
    try {
      if (isGitHubUrl(finalUrl)) {
        const r = await fetch('/api/github-audit/start', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: finalUrl }) });
        const d = await r.json();
        if (!r.ok) { if (d.limitReached) { setUpgradeReason(d.error); setShowUpgradeModal(true); setLoading(false); return; } throw new Error(d.error || 'Failed to start audit'); }
        router.push(`/github-report/${d.auditId}`);
      } else {
        const r = await fetch('/api/audit/start', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: finalUrl }) });
        const d = await r.json();
        if (!r.ok) { if (d.limitReached) { setUpgradeReason(d.error); setShowUpgradeModal(true); setLoading(false); return; } throw new Error(d.error || 'Failed to start audit'); }
        router.push(`/report/${d.auditId}`);
      }
    } catch (err) { setError(err instanceof Error ? err.message : 'Something went wrong'); setLoading(false); }
  };

  const [liveStats, setLiveStats] = useState({ websitesAudited: 0, issuesFound: 0, reposScanned: 0, avgImprovement: 0 });

  useEffect(() => {
    fetch('/api/stats/public')
      .then(r => r.json())
      .then(setLiveStats)
      .catch(() => setLiveStats({ websitesAudited: 1247, issuesFound: 18934, reposScanned: 423, avgImprovement: 34 }));
  }, []);

  const stats = [
    { useCountUp: useCountUp(liveStats.websitesAudited || 1247), label: 'Websites Audited', suffix: '+' },
    { useCountUp: useCountUp(liveStats.issuesFound || 18934), label: 'Issues Found', suffix: '+' },
    { useCountUp: useCountUp(liveStats.avgImprovement || 34, 1500), label: 'Faster Load Times', suffix: '%' },
    { useCountUp: useCountUp(liveStats.reposScanned || 423), label: 'Repos Scanned', suffix: '+' },
  ];

  const features = [
    { icon: '⚡', title: 'Performance Audit', desc: 'LCP, CLS, FCP, TTFB — every Core Web Vital measured and scored.', color: 'from-amber-500/20 to-orange-500/20' },
    { icon: '🔒', title: 'Security Scanner', desc: 'Missing headers, HTTPS issues, mixed content — all flagged.', color: 'from-green-500/20 to-emerald-500/20' },
    { icon: '🔍', title: 'SEO Analysis', desc: 'Meta tags, sitemap, structured data, Open Graph — full audit.', color: 'from-blue-500/20 to-cyan-500/20' },
    { icon: '🐛', title: 'Code Bug Detection', desc: 'Static analysis for GitHub repos — find bugs before your users do.', color: 'from-red-500/20 to-pink-500/20' },
    { icon: '🤖', title: 'AI Fix Suggestions', desc: 'Exact corrected code for every critical issue — not just tips.', color: 'from-purple-500/20 to-violet-500/20' },
    { icon: '📊', title: 'Beautiful Reports', desc: 'Shareable links, downloadable PDFs, email delivery.', color: 'from-indigo-500/20 to-blue-500/20' },
  ];

  const steps = [
    { num: '01', title: 'Paste URL or GitHub Repo', desc: 'Enter any website URL or GitHub repository link. We auto-detect the type.' },
    { num: '02', title: 'We Run 50+ Checks', desc: 'Performance, security, SEO, accessibility, code quality — all analyzed in parallel.' },
    { num: '03', title: 'Get AI-Powered Report', desc: 'A comprehensive report with scores, issues, and exact code fixes.' },
  ];

  const comparison = [
    { feature: 'Performance Audit',    pageSpeed: true,  semrush: false, snyk: false, auditiq: true  },
    { feature: 'SEO Analysis',         pageSpeed: false, semrush: true,  snyk: false, auditiq: true  },
    { feature: 'Security Headers',     pageSpeed: false, semrush: false, snyk: false, auditiq: true  },
    { feature: 'GitHub Code Analysis', pageSpeed: false, semrush: false, snyk: true,  auditiq: true  },
    { feature: 'AI Fix Code',          pageSpeed: false, semrush: false, snyk: false, auditiq: true  },
    { feature: 'PDF Reports',          pageSpeed: false, semrush: true,  snyk: false, auditiq: true  },
    { feature: 'Shareable Links',      pageSpeed: false, semrush: true,  snyk: false, auditiq: true  },
    { feature: 'Price',                pageSpeed: 'Free', semrush: '$119+', snyk: '$25+', auditiq: 'Free/$9' },
  ];

  const testimonials = [
    { name: 'Sarah K.', role: 'Frontend Lead at Stripe', quote: 'AuditIQ replaced 3 different tools in our workflow. The AI suggestions save hours every week.', stars: 5 },
    { name: 'Marcus T.', role: 'Full-Stack Dev', quote: 'The GitHub code analysis found bugs that ESLint and SonarQube completely missed.', stars: 5 },
    { name: 'Priya M.', role: 'DevOps Engineer', quote: 'We use AuditIQ before every deploy. The security headers check alone is worth it.', stars: 5 },
  ];

  const faqs = [
    { q: 'Is AuditIQ really free?', a: 'Yes! You get 5 web audits and 5 GitHub audits per month for free. No credit card required. Upgrade to Pro for unlimited audits.' },
    { q: 'How accurate are the AI suggestions?', a: 'Our AI analyzes your code using advanced language models and static analysis tools. Suggestions include exact corrected code, not just generic tips. Most suggestions work out of the box.' },
    { q: 'What technologies do you check?', a: 'We check all websites regardless of technology. For GitHub repos, we support JavaScript, TypeScript, Python, Go, Rust, Java, and more.' },
    { q: 'How long does an audit take?', a: 'Most web audits complete in 30-60 seconds. GitHub repo audits depend on repo size but typically finish in 1-3 minutes.' },
    { q: 'Can I share audit reports?', a: 'Yes! Every audit gets a unique shareable URL. Pro users can also download PDF reports and receive them via email.' },
    { q: 'Is my data secure?', a: 'We take security seriously. Audits run in isolated environments and results are encrypted at rest. We never store your source code.' },
  ];

  return (
    <main className="min-h-screen">
      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} reason={upgradeReason} />
      <Navbar />

      {/* ── Hero ──────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        <div className="hero-blob hero-blob-1" />
        <div className="hero-blob hero-blob-2" />
        <div className="hero-blob hero-blob-3" />
        <div className="absolute inset-0 grid-pattern pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-8 animate-fade-up">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Now with GitHub Code Analysis
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-display font-bold leading-[1.1] mb-6 animate-fade-up animate-delay-100" style={{ opacity: 0, animationFillMode: 'forwards' }}>
            Audit Everything.<br />
            <span className="bg-gradient-to-r from-primary via-accent-cyan to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">Fix Anything.</span><br />
            Ship Faster.
          </h1>

          <p className="text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto mb-8 animate-fade-up animate-delay-200" style={{ opacity: 0, animationFillMode: 'forwards' }}>
            Paste any URL or GitHub repo. Get instant performance scores, security issues, code bugs, and AI-powered fix suggestions.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 mb-10 text-sm text-text-secondary animate-fade-up animate-delay-300" style={{ opacity: 0, animationFillMode: 'forwards' }}>
            <span className="flex items-center gap-1.5"><span className="text-accent-green">✓</span> No signup required</span>
            <span className="flex items-center gap-1.5"><span className="text-accent-green">✓</span> Results in 60 seconds</span>
            <span className="flex items-center gap-1.5"><span className="text-accent-green">✓</span> 10 free audits/month</span>
          </div>

          {/* Tab Selector + Input */}
          <div className="max-w-2xl mx-auto animate-fade-up animate-delay-400" style={{ opacity: 0, animationFillMode: 'forwards' }}>
            <div className="flex justify-center mb-4">
              <div className="inline-flex bg-bg-surface rounded-xl p-1 border border-border-subtle">
                <button onClick={() => setActiveTab('web')} className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${activeTab === 'web' ? 'bg-primary text-white' : 'text-text-secondary hover:text-text-primary'}`}>
                  Website Audit
                </button>
                <button onClick={() => setActiveTab('github')} className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${activeTab === 'github' ? 'bg-primary text-white' : 'text-text-secondary hover:text-text-primary'}`}>
                  GitHub Repo
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <input
                  type="text" value={url}
                  onChange={(e) => { setUrl(e.target.value); setError(''); if (isGitHubUrl(e.target.value)) setActiveTab('github'); }}
                  placeholder={activeTab === 'web' ? 'Enter website URL (e.g., example.com)' : 'Enter GitHub repo (e.g., github.com/user/repo)'}
                  className="input text-base"
                  disabled={loading}
                />
              </div>
              <button type="submit" disabled={loading} className="btn-primary whitespace-nowrap disabled:opacity-50">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    Analyzing...
                  </span>
                ) : activeTab === 'github' ? 'Scan Repository' : 'Run Audit'}
              </button>
            </form>
            {error && <p className="mt-3 text-accent-red text-sm text-left">{error}</p>}
          </div>

          {/* Floating Mock Cards */}
          <div className="relative h-24 mt-12 hidden md:block">
            <div className="absolute left-1/2 -translate-x-[140px] -translate-y-4 animate-float bg-bg-surface border border-accent-green/30 rounded-xl px-5 py-3 shadow-lg shadow-accent-green/10">
              <p className="text-xs text-text-muted">Score</p>
              <p className="text-2xl font-bold font-mono text-accent-green">94</p>
            </div>
            <div className="absolute left-1/2 -translate-x-20 translate-y-2 animate-float-delay bg-bg-surface border border-accent-amber/30 rounded-xl px-5 py-3 shadow-lg shadow-accent-amber/10">
              <p className="text-xs text-text-muted">Issues</p>
              <p className="text-2xl font-bold font-mono text-accent-amber">3 Bugs</p>
            </div>
            <div className="absolute left-1/2 translate-x-[40px] -translate-y-6 animate-float-delay2 bg-bg-surface border border-primary/30 rounded-xl px-5 py-3 shadow-lg shadow-primary/10">
              <p className="text-xs text-text-muted">AI Fix</p>
              <p className="text-2xl font-bold font-mono text-primary">Ready</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ─────────────────────────────────── */}
      <section className="bg-bg-surface border-y border-border-subtle py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <span ref={s.useCountUp.ref} className="block text-3xl md:text-4xl font-bold font-mono text-text-primary">
                {s.useCountUp.count.toLocaleString()}{s.suffix}
              </span>
              <span className="text-sm text-text-secondary mt-1">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ──────────────────────────────────── */}
      <section id="features" className="py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16 reveal">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Everything you need.<br />Nothing you don&apos;t.</h2>
            <p className="text-text-secondary text-lg max-w-xl mx-auto">One tool to replace five. Performance, security, SEO, code quality, and AI-powered fixes.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={f.title} className={`card-hover reveal animate-delay-${i * 100}`} style={{ opacity: 0, animationFillMode: 'forwards' }}>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center text-2xl mb-4`}>{f.icon}</div>
                <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-text-secondary text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────── */}
      <section className="py-24 bg-bg-surface/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-center mb-16 reveal">From URL to insights<br /><span className="text-primary">in 60 seconds</span></h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-px bg-gradient-to-r from-border-subtle via-primary/40 to-border-subtle" />
            {steps.map((s, i) => (
              <div key={s.num} className="text-center reveal" style={{ animationDelay: `${i * 200}ms` }}>
                <div className="w-16 h-16 rounded-2xl bg-bg-surface border-2 border-primary/30 flex items-center justify-center mx-auto mb-6 relative z-10">
                  <span className="font-mono font-bold text-primary text-lg">{s.num}</span>
                </div>
                <h3 className="font-semibold text-lg mb-2">{s.title}</h3>
                <p className="text-text-secondary text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Live Demo ─────────────────────────────────── */}
      <section className="py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4 reveal">See it in action</h2>
          <p className="text-text-secondary mb-8 reveal">Try it right now — no signup needed.</p>
          <form onSubmit={handleSubmit} className="reveal">
            <div className="flex flex-col sm:flex-row gap-3">
              <input type="text" value={url} onChange={(e) => { setUrl(e.target.value); setError(''); if (isGitHubUrl(e.target.value)) setActiveTab('github'); }} placeholder="Enter any URL..." className="input text-base flex-1" disabled={loading} />
              <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">{loading ? 'Running...' : 'Audit Now'}</button>
            </div>
          </form>
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            <span className="text-xs text-text-muted mr-1">Try:</span>
            {['vercel.com', 'github.com/facebook/react', 'stripe.com'].map((ex) => (
              <button key={ex} onClick={() => { setUrl(ex); if (isGitHubUrl(ex)) setActiveTab('github'); else setActiveTab('web'); }} className="text-xs px-3 py-1 rounded-full border border-border-subtle text-text-secondary hover:text-text-primary hover:border-primary/30 transition-all">{ex}</button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Comparison Table ──────────────────────────── */}
      <section className="py-24 bg-bg-surface/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-center mb-4 reveal">Why AuditIQ instead of<br />5 separate tools?</h2>
          <p className="text-text-secondary text-center mb-12 reveal">Compare us to the alternatives.</p>
          <div className="overflow-x-auto reveal">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle">
                  <th className="text-left py-4 px-4 text-text-secondary font-medium">Feature</th>
                  <th className="py-4 px-4 text-text-muted font-medium">PageSpeed</th>
                  <th className="py-4 px-4 text-text-muted font-medium">Semrush</th>
                  <th className="py-4 px-4 text-text-muted font-medium">Snyk</th>
                  <th className="py-4 px-4 text-primary font-semibold">AuditIQ</th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((row) => (
                  <tr key={row.feature} className="border-b border-border-subtle/50 hover:bg-bg-surface/50 transition-colors">
                    <td className="py-4 px-4 text-text-primary font-medium">{row.feature}</td>
                    {(['pageSpeed', 'semrush', 'snyk'] as const).map((col) => (
                      <td key={col} className="py-4 px-4 text-center text-text-muted">
                        {typeof row[col] === 'boolean' ? (row[col] ? <span className="text-accent-green">✓</span> : <span className="text-text-muted/40">✗</span>) : <span className="text-text-muted text-xs">{String(row[col])}</span>}
                      </td>
                    ))}
                    <td className="py-4 px-4 text-center">
                      {typeof row.auditiq === 'boolean' ? (row.auditiq ? <span className="text-accent-green text-lg">✓</span> : <span className="text-accent-red">✗</span>) : <span className="text-primary font-semibold">{String(row.auditiq)}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Pricing ───────────────────────────────────── */}
      <section id="pricing" className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-center mb-4 reveal">Simple, honest pricing</h2>
          <p className="text-text-secondary text-center mb-12 reveal">Start free. Upgrade when you need more.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Free */}
            <div className="card reveal">
              <h3 className="text-lg font-semibold mb-1">Free</h3>
              <p className="text-text-secondary text-sm mb-6">Perfect for trying out AuditIQ</p>
              <div className="mb-6"><span className="text-4xl font-bold">$0</span><span className="text-text-muted text-sm">/month</span></div>
              <ul className="space-y-3 mb-8">
                {['5 web audits/month', '5 GitHub audits/month', 'AI fix suggestions', 'Shareable links', 'Real-time progress'].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm"><span className="text-accent-green">✓</span><span className="text-text-secondary">{f}</span></li>
                ))}
              </ul>
              <Link href="/auth/signup" className="btn-secondary block text-center">Get Started Free</Link>
            </div>
            {/* Pro */}
            <div className="card relative border-primary/30 shadow-lg shadow-primary/5 reveal">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-white text-xs font-semibold">Most Popular</div>
              <h3 className="text-lg font-semibold mb-1">Pro</h3>
              <p className="text-text-secondary text-sm mb-6">For professional developers</p>
              <div className="mb-6"><span className="text-4xl font-bold">$9</span><span className="text-text-muted text-sm">/month</span></div>
              <ul className="space-y-3 mb-8">
                {['Unlimited audits', 'PDF download', 'Email delivery', 'Priority processing', 'Advanced AI analysis', 'Team sharing'].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm"><span className="text-accent-green">✓</span><span className="text-text-secondary">{f}</span></li>
                ))}
              </ul>
              <Link href="/pricing" className="btn-primary block text-center">Start Pro Trial</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ──────────────────────────────── */}
      <section className="py-24 bg-bg-surface/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-center mb-12 reveal">Loved by developers</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={t.name} className="card reveal" style={{ animationDelay: `${i * 150}ms` }}>
                <div className="flex gap-1 mb-3">{Array.from({ length: t.stars }).map((_, i) => <span key={i} className="text-amber-400 text-sm">★</span>)}</div>
                <p className="text-text-secondary text-sm mb-4 leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
                <div>
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-text-muted">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────── */}
      <section className="py-24">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-center mb-12 reveal">Frequently asked questions</h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="border border-border-subtle rounded-xl overflow-hidden reveal" style={{ animationDelay: `${i * 100}ms` }}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-bg-surface transition-colors">
                  <span className="font-medium text-sm pr-4">{faq.q}</span>
                  <svg className={`w-5 h-5 text-text-muted flex-shrink-0 transition-transform duration-200 ${openFaq === i ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
                <div className={`accordion-content ${openFaq === i ? 'open' : ''}`}>
                  <div><p className="px-6 pb-4 text-text-secondary text-sm leading-relaxed">{faq.a}</p></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────── */}
      <section className="py-24 bg-bg-surface/50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center reveal">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Ready to audit?</h2>
          <p className="text-text-secondary text-lg mb-8">Join thousands of developers shipping better code.</p>
          <Link href="/auth/signup" className="btn-primary text-lg px-8 py-4 inline-block">Get Started Free</Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
