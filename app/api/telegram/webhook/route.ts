import { NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { Bot } from 'grammy';
import { validateInitDataServer } from '@/lib/telegram/server-auth';

// Инициализация бота и Redis
const bot = new Bot(process.env.BOT_TOKEN || '');
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(3, '1 s'),
});

// Обработчик POST-запросов (webhook от Telegram)
export async function POST(req: Request) {
  try {
    // Rate limiting по IP
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
    const { success } = await ratelimit.limit(`webhook:${ip}`);
    if (!success) {
      return new NextResponse('Too Many Requests', { status: 429 });
    }

    // Парсинг тела запроса
    const body = await req.json();
    
    // Обработка обновления через grammY
    await bot.handleUpdate(body);
    
    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error('[WEBHOOK_ERROR]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Обработчик GET для проверки здоровья
export async function GET() {
  return NextResponse.json({ status: 'ok' });
}

// Отключаем Edge Runtime для этого роута (нужен полноценный Node.js)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';