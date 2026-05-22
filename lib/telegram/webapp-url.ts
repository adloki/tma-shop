export function getWebAppUrl(): string {
  const configured =
    process.env.NEXT_PUBLIC_WEBAPP_URL ??
    process.env.WEBAPP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null);

  const url = configured ?? "http://localhost:3000";
  return url.replace(/\/$/, "");
}
