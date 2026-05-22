import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

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

export type ValidatedInitDataServer = {
  hash: string;
  authDate: number;
  user: TelegramWebAppUser;
  queryId?: string;
  startParam?: string;
  chatInstance?: string | null;
  chatType?: string | null;
};

export class InitDataValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InitDataValidationError";
  }
}

function buildDataCheckString(params: URLSearchParams): string {
  const pairs: string[] = [];

  for (const [key, value] of params.entries()) {
    if (key === "hash") continue;
    pairs.push(`${key}=${value}`);
  }

  return pairs.sort().join("\n");
}

function verifyInitDataHash(
  initData: string,
  botToken: string,
  expectedHash: string,
): void {
  const params = new URLSearchParams(initData);
  const dataCheckString = buildDataCheckString(params);

  const secretKey = createHmac("sha256", "WebAppData").update(botToken).digest();
  const calculatedHash = createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  const actual = Buffer.from(calculatedHash, "utf8");
  const expected = Buffer.from(expectedHash, "utf8");

  if (
    actual.length !== expected.length ||
    !timingSafeEqual(actual, expected)
  ) {
    throw new InitDataValidationError("Invalid init data hash");
  }
}

function parseUser(params: URLSearchParams): TelegramWebAppUser {
  const raw = params.get("user");
  if (!raw) {
    throw new InitDataValidationError("Missing user in init data");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new InitDataValidationError("Invalid user JSON in init data");
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    typeof (parsed as TelegramWebAppUser).id !== "number" ||
    typeof (parsed as TelegramWebAppUser).first_name !== "string"
  ) {
    throw new InitDataValidationError("Invalid user payload in init data");
  }

  return parsed as TelegramWebAppUser;
}

/**
 * Validates Telegram Mini App initData on the server using Node.js crypto.
 * @throws {InitDataValidationError} When init data is missing, expired, or tampered.
 */
export function validateInitDataServer(
  initData: string,
  botToken: string,
  maxAgeSec = INIT_DATA_MAX_AGE_SEC,
): ValidatedInitDataServer {
  const trimmedInitData = initData.trim();
  const trimmedBotToken = botToken.trim();

  if (!trimmedInitData) {
    throw new InitDataValidationError("Empty init data");
  }

  if (!trimmedBotToken) {
    throw new InitDataValidationError("Empty bot token");
  }

  const params = new URLSearchParams(trimmedInitData);
  const hash = params.get("hash");

  if (!hash) {
    throw new InitDataValidationError("Missing hash in init data");
  }

  const authDateRaw = params.get("auth_date");
  if (!authDateRaw) {
    throw new InitDataValidationError("Missing auth_date in init data");
  }

  const authDate = Number.parseInt(authDateRaw, 10);
  if (!Number.isFinite(authDate)) {
    throw new InitDataValidationError("Invalid auth_date in init data");
  }

  const now = Math.floor(Date.now() / 1000);
  if (now - authDate > maxAgeSec) {
    throw new InitDataValidationError("Init data expired");
  }

  verifyInitDataHash(trimmedInitData, trimmedBotToken, hash);

  const user = parseUser(params);
  const queryId = params.get("query_id");
  const startParam = params.get("start_param");

  return {
    hash,
    authDate,
    user,
    chatInstance: params.get("chat_instance"),
    chatType: params.get("chat_type"),
    ...(queryId ? { queryId } : {}),
    ...(startParam ? { startParam } : {}),
  };
}
