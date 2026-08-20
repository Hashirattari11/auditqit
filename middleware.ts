import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

const protectedRoutes = ['/dashboard', '/api/stripe'];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    if (!req.auth) {
      const loginUrl = new URL('/auth/login', req.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/dashboard/:path*', '/api/stripe/:path*'],
};
