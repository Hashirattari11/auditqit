import { NextRequest, NextResponse } from 'next/server';

const ADMIN_EMAIL = 'hashirattari73@gmail.com';

function getSessionEmail(request: NextRequest): string | null {
  const sessionToken =
    request.cookies.get('__Secure-authjs.session-token')?.value ||
    request.cookies.get('authjs.session-token')?.value ||
    request.cookies.get('__Secure-next-auth.session-token')?.value ||
    request.cookies.get('next-auth.session-token')?.value;
  if (!sessionToken) return null;
  try {
    const payload = JSON.parse(Buffer.from(sessionToken.split('.')[1], 'base64url').toString());
    return payload.email || payload.sub || null;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Admin routes — require admin email
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    const sessionToken =
      request.cookies.get('__Secure-authjs.session-token')?.value ||
      request.cookies.get('authjs.session-token')?.value ||
      request.cookies.get('__Secure-next-auth.session-token')?.value ||
      request.cookies.get('next-auth.session-token')?.value;

    if (!sessionToken) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    const email = getSessionEmail(request);
    if (email !== ADMIN_EMAIL) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Protected routes — require session
  const protectedRoutes = ['/dashboard', '/api/stripe'];
  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    const sessionToken =
      request.cookies.get('__Secure-authjs.session-token')?.value ||
      request.cookies.get('authjs.session-token')?.value ||
      request.cookies.get('__Secure-next-auth.session-token')?.value ||
      request.cookies.get('next-auth.session-token')?.value;

    if (!sessionToken) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/stripe/:path*', '/admin/:path*', '/api/admin/:path*'],
};
