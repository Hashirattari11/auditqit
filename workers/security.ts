import axios from 'axios';

const SECURITY_HEADERS = [
  { name: 'strict-transport-security', label: 'HSTS', severity: 'high' as const, description: 'Enforces HTTPS connections' },
  { name: 'content-security-policy', label: 'CSP', severity: 'high' as const, description: 'Prevents XSS attacks' },
  { name: 'x-frame-options', label: 'X-Frame-Options', severity: 'medium' as const, description: 'Prevents clickjacking' },
  { name: 'x-content-type-options', label: 'X-Content-Type-Options', severity: 'medium' as const, description: 'Prevents MIME sniffing' },
  { name: 'referrer-policy', label: 'Referrer-Policy', severity: 'low' as const, description: 'Controls referrer information' },
  { name: 'permissions-policy', label: 'Permissions-Policy', severity: 'low' as const, description: 'Controls browser features' },
  { name: 'x-xss-protection', label: 'X-XSS-Protection', severity: 'low' as const, description: 'Legacy XSS protection' },
];

export interface SecurityResult {
  headers: Record<string, string | null>;
  score: number;
  isHttps: boolean;
  issues: Array<{ severity: string; issue: string; description: string; fix: string }>;
  statusCode: number;
}

export async function runSecurity(url: string): Promise<SecurityResult> {
  const issues: SecurityResult['issues'] = [];
  const headers: Record<string, string | null> = {};

  let normalizedUrl = url.trim();
  if (!normalizedUrl.startsWith('http')) {
    normalizedUrl = 'https://' + normalizedUrl;
  }

  try {
    const response = await axios.head(normalizedUrl, {
      timeout: 8000,
      validateStatus: () => true,
      headers: { 'User-Agent': 'AuditIQ Security Scanner' },
    });

    const isHttps = normalizedUrl.startsWith('https://');
    if (!isHttps) {
      issues.push({
        severity: 'critical',
        issue: 'No HTTPS',
        description: 'Site is not using HTTPS — all data transmitted is unencrypted',
        fix: "Enable SSL/TLS certificate. Use Let's Encrypt for free certificates.",
      });
    }

    let score = 100;
    for (const header of SECURITY_HEADERS) {
      const value = response.headers[header.name] ?? null;
      headers[header.name] = value;

      if (!value) {
        const deduction = header.severity === 'high' ? 20 : header.severity === 'medium' ? 10 : 5;
        score -= deduction;
        issues.push({
          severity: header.severity,
          issue: `Missing ${header.label} header`,
          description: header.description,
          fix: `Add "${header.name}" header to your server/CDN configuration`,
        });
      }
    }

    return {
      headers,
      score: Math.max(0, score),
      isHttps,
      issues,
      statusCode: response.status,
    };
  } catch (err: any) {
    return {
      headers: {},
      score: 0,
      isHttps: false,
      issues: [{ severity: 'critical', issue: 'Could not connect', description: err.message, fix: 'Check if the URL is accessible' }],
      statusCode: 0,
    };
  }
}
