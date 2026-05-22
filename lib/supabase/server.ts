import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { env } from "@/lib/env";
import { getSupabaseProjectUrl } from "@/lib/supabase/url";

import type { Database } from "@/lib/supabase/types";

export function createServerSupabaseClient(): SupabaseClient<Database> {
  return createClient<Database>(
    getSupabaseProjectUrl(),
    env.SUPABASE_SERVICE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
