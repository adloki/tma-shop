import { env } from "@/lib/env";

/** Supabase JS client expects project root URL, not PostgREST `/rest/v1`. */
export function getSupabaseProjectUrl(): string {
  return env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/rest\/v1\/?$/i, "");
}
