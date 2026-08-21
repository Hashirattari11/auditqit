'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AgencySetupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [logo, setLogo] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#6366F1');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientUrl, setClientUrl] = useState('');

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setLogo(reader.result as string);
    reader.readAsDataURL(file);
  };

  const createAgency = async () => {
    const res = await fetch('/api/agency', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, logo, primaryColor }) });
    if (res.ok) setStep(2);
  };

  const addClient = async () => {
    const res = await fetch('/api/agency/clients', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: clientName, email: clientEmail, website_url: clientUrl }) });
    if (res.ok) setStep(4);
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-lg w-full">
        <h1 className="text-2xl font-bold text-center mb-2">Agency Setup</h1>
        <p className="text-text-muted text-center text-sm mb-8">Step {step} of 4</p>

        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {[1,2,3,4].map(s => <div key={s} className={`h-1 flex-1 rounded ${s <= step ? 'bg-accent-purple' : 'bg-bg-surface'}`} />)}
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">Your Agency Details</h2>
            <input placeholder="Agency name" value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-bg border border-border-subtle" />
            <div>
              <label className="text-sm text-text-muted block mb-2">Logo</label>
              <input type="file" accept="image/*" onChange={handleLogoUpload} className="text-sm" />
              {logo && <img src={logo} alt="Logo preview" className="h-10 mt-2" />}
            </div>
            <div>
              <label className="text-sm text-text-muted block mb-2">Brand Color</label>
              <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="w-12 h-10 rounded cursor-pointer" />
            </div>
            <button onClick={createAgency} disabled={!name} className="w-full py-3 rounded-xl bg-accent-purple text-white font-semibold hover:opacity-90 disabled:opacity-50">Next →</button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">Add Your First Client</h2>
            <input placeholder="Company name" value={clientName} onChange={e => setClientName(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-bg border border-border-subtle" />
            <input placeholder="Client email" value={clientEmail} onChange={e => setClientEmail(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-bg border border-border-subtle" />
            <input placeholder="Website URL" value={clientUrl} onChange={e => setClientUrl(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-bg border border-border-subtle" />
            <button onClick={addClient} disabled={!clientName || !clientEmail || !clientUrl} className="w-full py-3 rounded-xl bg-accent-purple text-white font-semibold hover:opacity-90 disabled:opacity-50">Add Client →</button>
            <button onClick={() => setStep(4)} className="w-full py-3 rounded-xl bg-bg-surface border border-border-subtle text-sm">Skip for now</button>
          </div>
        )}

        {step === 4 && (
          <div className="text-center space-y-4">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-lg font-bold">You&apos;re all set!</h2>
            <p className="text-text-secondary text-sm">Your agency portal is ready. Add clients and start sending reports.</p>
            <button onClick={() => router.push('/agency')} className="px-6 py-3 rounded-xl bg-accent-purple text-white font-semibold hover:opacity-90">Go to Dashboard →</button>
          </div>
        )}
      </div>
    </main>
  );
}
