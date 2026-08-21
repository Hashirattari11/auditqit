import axios from 'axios';

export interface FetchResult {
  html: string;
  statusCode: number;
  responseTime: number;
  finalUrl: string;
  contentLength: string | null;
  contentType: string | null;
  error: string | null;
}

export async function runFetch(url: string): Promise<FetchResult> {
  let normalizedUrl = url.trim();
  if (!normalizedUrl.startsWith('http')) {
    normalizedUrl = 'https://' + normalizedUrl;
  }

  const startTime = Date.now();

  try {
    const response = await axios.get(normalizedUrl, {
      timeout: 10000,
      maxRedirects: 5,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AuditIQ/1.0; +https://auditiq.com)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      validateStatus: (status) => status < 500,
    });

    return {
      html: typeof response.data === 'string' ? response.data : '',
      statusCode: response.status,
      responseTime: Date.now() - startTime,
      finalUrl: response.request?.res?.responseUrl ?? normalizedUrl,
      contentLength: String(response.headers['content-length'] ?? null),
      contentType: String(response.headers['content-type'] ?? null),
      error: null,
    };
  } catch (err: any) {
    return {
      html: '',
      statusCode: 0,
      responseTime: Date.now() - startTime,
      finalUrl: normalizedUrl,
      contentLength: null,
      contentType: null,
      error: err.message,
    };
  }
}
