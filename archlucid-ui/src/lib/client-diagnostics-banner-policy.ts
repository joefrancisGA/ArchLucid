/**
 * On-page client diagnostics banner (rose fixed footer). Off by default after GA.
 * Set `NEXT_PUBLIC_CLIENT_DIAGNOSTICS_BANNER=1` to show the banner for local debugging.
 */
export function isClientDiagnosticsBannerEnabled(): boolean {
  const raw = process.env.NEXT_PUBLIC_CLIENT_DIAGNOSTICS_BANNER;

  if (raw === "1" || raw === "true") {
    return true;
  }

  return false;
}
