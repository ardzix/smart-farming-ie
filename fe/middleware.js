import { NextResponse } from 'next/server';

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  console.log(`[MIDDLEWARE CHECK] Navigating to: ${pathname}`);

  // Inspect the cookies received by the server.
  const allCookies = request.cookies.getAll();
  console.log(
    '[MIDDLEWARE CHECK] All Cookies:',
    allCookies.map((c) => `${c.name} (Path: ${c.path || 'unknown'})`).join(', ')
  );

  const accessToken = request.cookies.get('access_token')?.value;
  const userCookie = request.cookies.get('user')?.value;

  console.log(`[MIDDLEWARE CHECK] Access Token Present? ${!!accessToken}`);
  console.log(`[MIDDLEWARE CHECK] User Cookie Present? ${!!userCookie}`);

  // Apply a simple cookie-based guard to protected routes.
  if (pathname.startsWith('/admin') || pathname.startsWith('/dashboard')) {
    if (!accessToken || !userCookie) {
      console.log('[MIDDLEWARE CHECK] Denied: incomplete cookies. Redirecting to login.');
      return NextResponse.redirect(new URL('/login', request.url));
    }

    console.log('[MIDDLEWARE CHECK] Accepted: entering protected page.');
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
};
