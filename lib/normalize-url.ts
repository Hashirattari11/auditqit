export function normalizeUrl(input: string): string {
  let url = input.trim();

  // Remove trailing slash
  url = url.replace(/\/$/, '');

  // Add protocol if missing
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }

  // Validate it's a real URL
  try {
    new URL(url);
    return url;
  } catch {
    throw new Error('Invalid URL: ' + input);
  }
}
