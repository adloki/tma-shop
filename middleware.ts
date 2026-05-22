import { NextResponse, type NextRequest } from "next/server";

import { env } from "@/lib/env";
import { getRedis } from "@/lib/redis";
import {
  validateInitData,
  type ValidatedInitData,
} from "@/lib/telegram/validate-init-data";

const INIT_CACHE_PREFIX = "tma:init:";
const INIT_CACHE_TTL_SEC = 86_400;

const PUBLIC_PATHS = ["/api/webhook", "/api/telegram/webhook", "/api/health"];

type CachedInitData = ValidatedInitData;

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

function getInitData(request: NextRequest): string | null {
  const authorization = request.headers.get("authorization");
  if (authorization?.toLowerCase().startsWith("tma ")) {
    return authorization.slice(4).trim();
  }

  const cookieInitData = request.cookies.get("tma-init-data")?.value;
  if (cookieInitData) {
    return decodeURIComponent(cookieInitData);
  }

  return (
    request.headers.get("x-telegram-init-data") ??
    request.nextUrl.searchParams.get("tgWebAppData")
  );
}

/** HTML navigations cannot send hash initData; API routes always require auth. */
function requiresInitData(pathname: string, request: NextRequest): boolean {
  if (isPublicPath(pathname)) return false;
  if (pathname.startsWith("/api/")) return true;

  const fetchDest = request.headers.get("sec-fetch-dest");
  if (fetchDest === "document" || fetchDest === "iframe") return false;

  return true;
}

function cacheKey(hash: string): string {
  return `${INIT_CACHE_PREFIX}${hash}`;
}

async function readInitCache(hash: string): Promise<CachedInitData | null> {
  const redis = getRedis();
  return redis.get<CachedInitData>(cacheKey(hash));
}

async function writeInitCache(data: CachedInitData): Promise<void> {
  const redis = getRedis();
  await redis.set(cacheKey(data.hash), data, { ex: INIT_CACHE_TTL_SEC });
}

function attachTelegramHeaders(
  request: NextRequest,
  data: CachedInitData,
): NextResponse {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-telegram-user-id", String(data.user.id));
  requestHeaders.set("x-telegram-init-hash", data.hash);

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!requiresInitData(pathname, request)) {
    return NextResponse.next();
  }

  const initData = getInitData(request);
  if (!initData) {
    return NextResponse.json(
      { error: "Missing Telegram init data" },
      { status: 401 },
    );
  }

  const params = new URLSearchParams(initData);
  const hash = params.get("hash");

  if (hash) {
    const cached = await readInitCache(hash);
    if (cached) {
      return attachTelegramHeaders(request, cached);
    }
  }

  const validated = await validateInitData(initData, env.BOT_TOKEN);
  if (!validated) {
    return NextResponse.json(
      { error: "Invalid or expired Telegram init data" },
      { status: 401 },
    );
  }

  await writeInitCache(validated);
  return attachTelegramHeaders(request, validated);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
