import { z } from "zod";

const serverEnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  BOT_TOKEN: z
    .string()
    .regex(/^\d+:[A-Za-z0-9_-]+$/, "BOT_TOKEN must look like <id>:<secret>"),
  SUPABASE_SERVICE_KEY: z.string().min(1, "SUPABASE_SERVICE_KEY is required"),
  UPSTASH_REDIS_URL: z.string().url("UPSTASH_REDIS_URL must be a valid URL"),
  UPSTASH_REDIS_REST_TOKEN: z
    .string()
    .min(1, "UPSTASH_REDIS_REST_TOKEN is required"),
});

const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"),
  NEXT_PUBLIC_WEBAPP_URL: z
    .string()
    .url("NEXT_PUBLIC_WEBAPP_URL must be a valid URL")
    .optional(),
});

const optionalServerEnvSchema = z.object({
  TELEGRAM_WEBHOOK_SECRET: z.string().min(1).optional(),
  WEBAPP_URL: z.string().url().optional(),
});

function formatZodError(error: z.ZodError): string {
  return error.issues
    .map((issue) => `  ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
}

function parseEnv() {
  const server = serverEnvSchema.safeParse(process.env);
  if (!server.success) {
    throw new Error(
      `Invalid server environment variables:\n${formatZodError(server.error)}\n\nCopy .env.example to .env.local and fill every value.`,
    );
  }

  const client = clientEnvSchema.safeParse(process.env);
  if (!client.success) {
    throw new Error(
      `Invalid public environment variables:\n${formatZodError(client.error)}\n\nCopy .env.example to .env.local and fill every value.`,
    );
  }

  const optional = optionalServerEnvSchema.safeParse(process.env);
  if (!optional.success) {
    throw new Error(
      `Invalid optional environment variables:\n${formatZodError(optional.error)}`,
    );
  }

  return { ...server.data, ...client.data, ...optional.data };
}

/** Parsed env; throws on import when any required variable is missing or invalid. */
export const env = parseEnv();

export type Env = typeof env;
