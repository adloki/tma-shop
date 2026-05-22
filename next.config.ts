import type { NextConfig } from "next";

import "@/lib/env";

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(
  /\/rest\/v1\/?$/i,
  "",
);
const supabaseHost = supabaseUrl ? new URL(supabaseUrl).hostname : "localhost";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: supabaseHost,
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
