const INIT_DATA_MAX_AGE_SEC = 86_400;

export type TelegramWebAppUser = {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  photo_url?: string;
};

export type ValidatedInitData = {
  hash: string;
  authDate: number;
  user: TelegramWebAppUser;
};

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function hmacSha256(
  key: string | ArrayBuffer,
  message: string,
): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const keyBytes =
    typeof key === "string" ? encoder.encode(key) : new Uint8Array(key);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  return crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(message));
}

function buildDataCheckString(params: URLSearchParams): string {
  const pairs: string[] = [];

  for (const [key, value] of params.entries()) {
    if (key === "hash") continue;
    pairs.push(`${key}=${value}`);
  }

  return pairs.sort().join("\n");
}

async function verifyInitDataHash(
  initData: string,
  botToken: string,
): Promise<string | null> {
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");

  if (!hash) return null;

  const dataCheckString = buildDataCheckString(params);
  const secretKey = await hmacSha256("WebAppData", botToken);
  const calculated = await hmacSha256(secretKey, dataCheckString);

  return bufferToHex(calculated) === hash ? hash : null;
}

function parseUser(params: URLSearchParams): TelegramWebAppUser | null {
  const raw = params.get("user");
  if (!raw) return null;

  try {
    const user = JSON.parse(raw) as TelegramWebAppUser;
    if (typeof user.id !== "number") return null;
    return user;
  } catch {
    return null;
  }
}

export async function validateInitData(
  initData: string,
  botToken: string,
  maxAgeSec = INIT_DATA_MAX_AGE_SEC,
): Promise<ValidatedInitData | null> {
  const params = new URLSearchParams(initData);
  const authDateRaw = params.get("auth_date");

  if (!authDateRaw) return null;

  const authDate = Number.parseInt(authDateRaw, 10);
  if (!Number.isFinite(authDate)) return null;

  const now = Math.floor(Date.now() / 1000);
  if (now - authDate > maxAgeSec) return null;

  const verifiedHash = await verifyInitDataHash(initData, botToken);
  if (!verifiedHash) return null;

  const user = parseUser(params);
  if (!user) return null;

  return { hash: verifiedHash, authDate, user };
}
