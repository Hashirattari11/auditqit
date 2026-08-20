import axios from 'axios';

interface HeaderCheckResult {
  isHttps: boolean;
  responseTime: number;
  statusCode: number;
  headers: Record<string, string | undefined>;
  securityHeaders: {
    'X-Frame-Options': { present: boolean; value: string | null };
    'Content-Security-Policy': { present: boolean; value: string | null };
    'X-XSS-Protection': { present: boolean; value: string | null };
    'Strict-Transport-Security': { present: boolean; value: string | null };
    'Referrer-Policy': { present: boolean; value: string | null };
    'X-Content-Type-Options': { present: boolean; value: string | null };
    'Permissions-Policy': { present: boolean; value: string | null };
  };
}

export async function checkHeaders(url: string): Promise<HeaderCheckResult> {
  const startTime = Date.now();

  const response = await axios.get(url, {
    timeout: 15000,
    maxRedirects: 10,
    validateStatus: () => true,
    headers: {
      'User-Agent': 'AuditIQ/1.0 (Web Audit Tool)',
    },
  });

  const responseTime = Date.now() - startTime;
  const headers = response.headers as Record<string, string>;

  const getHeader = (name: string): { present: boolean; value: string | null } => {
    const value = headers[name.toLowerCase()] || headers[name];
    return {
      present: !!value,
      value: value || null,
    };
  };

  return {
    isHttps: url.startsWith('https://'),
    responseTime,
    statusCode: response.status,
    headers,
    securityHeaders: {
      'X-Frame-Options': getHeader('X-Frame-Options'),
      'Content-Security-Policy': getHeader('Content-Security-Policy'),
      'X-XSS-Protection': getHeader('X-XSS-Protection'),
      'Strict-Transport-Security': getHeader('Strict-Transport-Security'),
      'Referrer-Policy': getHeader('Referrer-Policy'),
      'X-Content-Type-Options': getHeader('X-Content-Type-Options'),
      'Permissions-Policy': getHeader('Permissions-Policy'),
    },
  };
}
