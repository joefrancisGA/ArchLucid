/**
 * Pre-release: show on-page client diagnostics unless explicitly disabled.
 * Set `NEXT_PUBLIC_CLIENT_DIAGNOSTICS_BANNER=0` to hide the banner after GA.
 */
export function isClientDiagnosticsBannerEnabled(): boolean {
  const raw = process.env.NEXT_PUBLIC_CLIENT_DIAGNOSTICS_BANNER;

  if (raw === "0" || raw === "false") {
    return false;
  }

  return true;
}
