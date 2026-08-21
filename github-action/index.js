const core = require('@actions/core');

const BASE_URL = 'https://auditqit-0-eight.vercel.app';

async function run() {
  try {
    const apiKey = core.getInput('api-key', { required: true });
    const url = core.getInput('url');
    const repo = core.getInput('repo');
    const minPerformance = parseInt(core.getInput('min-performance') || '70');
    const minSeo = parseInt(core.getInput('min-seo') || '70');
    const failOnCritical = core.getInput('fail-on-critical') === 'true';

    core.info('Starting AuditIQ audit...');

    // Start audit
    const endpoint = url ? `${BASE_URL}/api/v1/audit/website` : `${BASE_URL}/api/v1/audit/github`;
    const body = url ? { url } : { repoUrl: `https://github.com/${repo}` };

    const startRes = await fetch(endpoint, {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!startRes.ok) {
      const err = await startRes.json();
      core.setFailed(`Failed to start audit: ${err.error}`);
      return;
    }

    const { auditId } = await startRes.json();
    core.info(`Audit started: ${auditId}`);

    // Poll for results (max 2 minutes)
    let result = null;
    for (let i = 0; i < 40; i++) {
      await new Promise(r => setTimeout(r, 3000));
      const statusRes = await fetch(`${BASE_URL}/api/v1/audit/${auditId}`, {
        headers: { 'x-api-key': apiKey },
      });
      const data = await statusRes.json();
      if (data.status === 'completed' || data.status === 'failed') {
        result = data;
        break;
      }
    }

    if (!result) {
      core.setFailed('Audit timed out after 2 minutes');
      return;
    }

    if (result.status === 'failed') {
      core.setFailed('Audit failed');
      return;
    }

    const scores = result.scores || {};
    const issues = result.results?.errors?.failedSteps || [];

    // Set outputs
    core.setOutput('performance-score', scores.performance || 0);
    core.setOutput('seo-score', scores.seo || 0);
    core.setOutput('security-score', scores.security || 0);
    core.setOutput('audit-url', `${BASE_URL}/report/${auditId}`);
    core.setOutput('issues-found', issues.length);

    // Log summary
    core.info(`Performance: ${scores.performance || 0}/100`);
    core.info(`SEO: ${scores.seo || 0}/100`);
    core.info(`Security: ${scores.security || 0}/100`);
    core.info(`Issues found: ${issues.length}`);
    core.info(`Full report: ${BASE_URL}/report/${auditId}`);

    // Check thresholds
    if (scores.performance && scores.performance < minPerformance) {
      core.setFailed(`Performance score ${scores.performance} below minimum ${minPerformance}`);
      return;
    }
    if (scores.seo && scores.seo < minSeo) {
      core.setFailed(`SEO score ${scores.seo} below minimum ${minSeo}`);
      return;
    }
    if (failOnCritical && issues.length > 0) {
      core.setFailed(`Found ${issues.length} critical issues`);
      return;
    }

    core.info('All checks passed!');
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
