const BASE_URL = 'https://auditqit-0-eight.vercel.app';
const STEPS = ['fetch', 'headers', 'seo', 'links', 'lighthouse', 'playwright', 'ai'];
let currentAuditId = null;

function show(screen) {
  document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
  document.getElementById(`screen-${screen}`).classList.remove('hidden');
}

document.addEventListener('DOMContentLoaded', async () => {
  // Get current tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const url = tab?.url || '';
  document.getElementById('current-url').textContent = url;

  // Check for API key
  const { apiKey } = await chrome.storage.local.get('apiKey');

  if (!apiKey) {
    show('login');
    return;
  }

  if (!url || url.startsWith('chrome://') || url.startsWith('chrome-extension://')) {
    document.getElementById('current-url').textContent = 'Cannot audit this page';
    return;
  }

  show('ready');
  setupHandlers(url, apiKey);
});

document.getElementById('save-key-btn')?.addEventListener('click', () => {
  const key = document.getElementById('api-key-input').value.trim();
  if (!key) return;
  chrome.storage.local.set({ apiKey: key }, () => location.reload());
});

document.getElementById('settings-btn')?.addEventListener('click', () => {
  const { apiKey } = chrome.storage.local.get('apiKey');
  if (apiKey) {
    if (confirm('Clear saved API key?')) {
      chrome.storage.local.remove('apiKey', () => location.reload());
    }
  }
});

function setupHandlers(url, apiKey) {
  document.getElementById('audit-btn')?.addEventListener('click', () => startAudit(url, apiKey));
  document.getElementById('rerun-btn')?.addEventListener('click', () => startAudit(url, apiKey));
  document.getElementById('retry-btn')?.addEventListener('click', () => startAudit(url, apiKey));
}

async function startAudit(url, apiKey) {
  show('loading');
  let stepIndex = 0;

  const stepInterval = setInterval(() => {
    if (stepIndex < STEPS.length) {
      document.getElementById('loading-step').textContent = `Step: ${STEPS[stepIndex]}`;
      document.getElementById('progress-fill').style.width = `${((stepIndex + 1) / STEPS.length) * 100}%`;
      stepIndex++;
    }
  }, 3000);

  try {
    const res = await fetch(`${BASE_URL}/api/v1/audit/website`, {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to start audit');
    }

    const { auditId } = await res.json();
    currentAuditId = auditId;

    // Poll for results
    for (let i = 0; i < 60; i++) {
      await new Promise(r => setTimeout(r, 3000));
      const statusRes = await fetch(`${BASE_URL}/api/v1/audit/${auditId}`, {
        headers: { 'x-api-key': apiKey },
      });
      const data = await statusRes.json();

      if (data.status === 'completed') {
        clearInterval(stepInterval);
        showResults(data);
        return;
      }
      if (data.status === 'failed') {
        clearInterval(stepInterval);
        throw new Error('Audit failed');
      }
    }

    clearInterval(stepInterval);
    throw new Error('Audit timed out');
  } catch (err) {
    clearInterval(stepInterval);
    document.getElementById('error-message').textContent = err.message;
    show('error');
  }
}

function showResults(data) {
  show('results');

  const scores = data.scores || {};
  const overall = scores.overall || 0;
  const circumference = 2 * Math.PI * 42;
  const offset = circumference - (overall / 100) * circumference;

  const circle = document.getElementById('score-circle');
  circle.style.strokeDashoffset = offset;
  circle.style.stroke = overall >= 80 ? '#22c55e' : overall >= 50 ? '#eab308' : '#ef4444';

  document.getElementById('score-value').textContent = overall;
  document.getElementById('score-value').style.color = overall >= 80 ? '#22c55e' : overall >= 50 ? '#eab308' : '#ef4444';

  // Sub scores
  const subScores = document.getElementById('sub-scores');
  subScores.innerHTML = '';
  const labels = { performance: 'Performance', seo: 'SEO', security: 'Security' };
  for (const [key, label] of Object.entries(labels)) {
    const val = scores[key] || 0;
    const color = val >= 80 ? '#22c55e' : val >= 50 ? '#eab308' : '#ef4444';
    subScores.innerHTML += `<div class="sub-score"><div class="sub-score-label">${label}</div><div class="sub-score-value" style="color:${color}">${val}</div></div>`;
  }

  // Top issues
  const issuesDiv = document.getElementById('top-issues');
  issuesDiv.innerHTML = '';
  const failedSteps = data.results?.errors?.failedSteps || [];
  if (failedSteps.length > 0) {
    failedSteps.slice(0, 3).forEach(s => {
      issuesDiv.innerHTML += `<div class="issue error">${s.name}: ${s.error || 'Failed'}</div>`;
    });
  }

  // Full report link
  document.getElementById('full-report-link').href = `${BASE_URL}/report/${data.id || currentAuditId}`;
}
