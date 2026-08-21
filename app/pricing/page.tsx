import Link from 'next/link';
import { auth } from '@/lib/auth';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default async function PricingPage() {
  const session = await auth();

  const features = {
    free: ['10 web audits/month', '10 GitHub audits/month', 'AI fix suggestions', 'Shareable links', 'Real-time progress', 'Community support'],
    pro: ['Unlimited audits', 'Everything in Free', 'PDF report download', 'Monitoring (3 sites)', 'API access (100 req/hour)', 'Priority processing', 'Email report delivery'],
    team: ['Everything in Pro', '5 team members', '500 shared audits/month', 'Bulk URL scanning', 'White-label reports', 'Monitoring (20 sites)', 'API access (500 req/hour)', 'Priority support'],
  };

  return (
    <main className="min-h-screen">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-32 pb-24">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">Simple, transparent pricing</h1>
          <p className="text-text-secondary text-lg">Start free, upgrade when you need more.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Free Plan */}
          <div className="card animate-fade-up">
            <h2 className="text-xl font-semibold mb-2">Free</h2>
            <p className="text-text-secondary text-sm mb-6">Perfect for trying out AuditIQ</p>
            <div className="mb-6">
              <span className="text-4xl font-bold">$0</span>
              <span className="text-text-muted">/month</span>
            </div>
            <ul className="space-y-3 mb-8">
              {features.free.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm">
                  <span className="text-accent-green">✓</span>
                  <span className="text-text-secondary">{f}</span>
                </li>
              ))}
            </ul>
            <Link href={session ? '/' : '/auth/signup'} className="btn-secondary block text-center">Get Started Free</Link>
          </div>

          {/* Pro Plan */}
          <div className="card relative border-primary/30 shadow-lg shadow-primary/5 animate-fade-up animate-delay-100" style={{ opacity: 0, animationFillMode: 'forwards' }}>
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-white text-xs font-semibold">Most Popular</div>
            <h2 className="text-xl font-semibold mb-2">Pro</h2>
            <p className="text-text-secondary text-sm mb-6">For professional developers</p>
            <div className="mb-6">
              <span className="text-4xl font-bold">$9</span>
              <span className="text-text-muted">/month</span>
            </div>
            <ul className="space-y-3 mb-8">
              {features.pro.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm">
                  <span className="text-accent-green">✓</span>
                  <span className="text-text-secondary">{f}</span>
                </li>
              ))}
            </ul>
            <form action="/api/stripe/create-checkout" method="POST">
              <button type="submit" className="btn-primary w-full">Upgrade to Pro</button>
            </form>
          </div>

          {/* Team Plan */}
          <div className="card animate-fade-up animate-delay-200" style={{ opacity: 0, animationFillMode: 'forwards' }}>
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-accent-purple text-white text-xs font-semibold hidden md:block">New</div>
            <h2 className="text-xl font-semibold mb-2">Team</h2>
            <p className="text-text-secondary text-sm mb-6">For agencies and teams</p>
            <div className="mb-6">
              <span className="text-4xl font-bold">$49</span>
              <span className="text-text-muted">/month</span>
            </div>
            <ul className="space-y-3 mb-8">
              {features.team.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm">
                  <span className="text-accent-green">✓</span>
                  <span className="text-text-secondary">{f}</span>
                </li>
              ))}
            </ul>
            <form action="/api/stripe/create-checkout" method="POST">
              <input type="hidden" name="plan" value="team" />
              <button type="submit" className="w-full py-3 rounded-xl bg-accent-purple text-white font-semibold hover:opacity-90 transition-opacity">Start Team Trial</button>
            </form>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
