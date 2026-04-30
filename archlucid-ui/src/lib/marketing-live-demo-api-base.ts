/**
 * Resolves API base for the marketing `/live-demo` page (same chain as `live-demo/page.tsx`).
 * Used to gate the public "Live demo" nav link so dead routes are not advertised.
 */
export function resolveMarketingLiveDemoApiBase(): string {
  const explicit = process.env.NEXT_PUBLIC_DEMO_PREVIEW_API_BASE?.trim();

  if (explicit)
    return explicit.replace(/\/$/, "");

  const server = process.env.ARCHLUCID_API_BASE_URL?.trim();

  if (server)
    return server.replace(/\/$/, "");

  const pub = process.env.NEXT_PUBLIC_ARCHLUCID_API_BASE_URL?.trim();

  if (pub)
    return pub.replace(/\/$/, "");

  return "";
}
