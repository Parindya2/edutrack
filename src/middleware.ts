
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  console.log(`[MIDDLEWARE] ${pathname} - Token exists: ${!!token}`);

  const protectedRoutes = ['/dashboard', '/profile', '/students', '/attendance', '/settings'];
  const publicRoutes = ['/login', '/register'];

  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  // Handle protected routes
  if (isProtectedRoute) {
    if (!token) {
      console.log('[MIDDLEWARE] No token, redirecting to login');
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      console.log('[MIDDLEWARE] Verifying token...');
      const decoded = await verifyToken(token);
      console.log('[MIDDLEWARE] Token valid for:', decoded.email);
      return NextResponse.next();
    } catch (error: any) {
      console.log('[MIDDLEWARE] Token invalid:', error.message);
      
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.set('token', '', {
        expires: new Date(0),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });
      return response;
    }
  }

  // Handle public routes when authenticated
  if (isPublicRoute && token) {
    try {
      const decoded = await verifyToken(token);
      if (decoded) {
        console.log('[MIDDLEWARE] Already authenticated, redirecting to dashboard');
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    } catch (error) {
      console.log('[MIDDLEWARE] Invalid token on public route, clearing');
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};