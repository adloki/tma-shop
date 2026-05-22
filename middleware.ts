```ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Легковесный middleware только для редиректов и заголовков
export function middleware(request: NextRequest) {
// Добавляем заголовки для Telegram WebApp (CORS, iframe)
const response = NextResponse.next();
response.headers.set('X-Frame-Options', 'ALLOW-FROM https://web.telegram.org');
response.headers.set('Content-Security-Policy', "frame-ancestors https://web.telegram.org https://*.telegram.org 'self'");
return response;
}

// Запускаем только на WebApp-роутах и API для Telegram
export const config = {
matcher: ['/((?!_next/static
