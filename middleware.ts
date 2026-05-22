import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Легковесный middleware только для заголовков Telegram WebApp
export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Заголовки для работы в iframe Telegram
  response.headers.set('X-Frame-Options', 'ALLOW-FROM https://web.telegram.org');
  response.headers.set('Content-Security-Policy', "frame-ancestors https://web.telegram.org https://*.telegram.org 'self'");
  
  return response;
}

// На каких путях запускать middleware (все, кроме статики и изображений)
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};