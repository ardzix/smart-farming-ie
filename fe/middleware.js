import { NextResponse } from 'next/server';

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  console.log(`[MIDDLEWARE CHECK] Navigasi ke: ${pathname}`);

  // Cek Cookie yang diterima Server
  const allCookies = request.cookies.getAll();
  console.log('[MIDDLEWARE CHECK] Semua Cookie:', allCookies.map(c => `${c.name} (Path: ${c.path || 'unknown'})`).join(', '));

  const accessToken = request.cookies.get('access_token')?.value;
  const userCookie = request.cookies.get('user')?.value;

  console.log(`[MIDDLEWARE CHECK] Access Token Ada? ${!!accessToken}`);
  console.log(`[MIDDLEWARE CHECK] User Cookie Ada? ${!!userCookie}`);

  // Logika Redirect Sederhana untuk Test
  if (pathname.startsWith('/admin') || pathname.startsWith('/dashboard')) {
    if (!accessToken || !userCookie) {
      console.log('[MIDDLEWARE CHECK] ❌ Ditolak: Cookie tidak lengkap. Redirect ke Login.');
      return NextResponse.redirect(new URL('/login', request.url));
    }
    console.log('[MIDDLEWARE CHECK] ✅ Diterima: Masuk ke halaman.');
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
};