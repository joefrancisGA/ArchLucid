/** Playwright JwtBearer lane only — suppresses LS-010 redirect when dev-default scope omits sample-visit. */
export const E2E_LS010_BOOTSTRAP_REDIRECT_SUPPRESS_STORAGE_KEY =
  "archlucid_e2e_suppress_ls010_bootstrap_redirect_v1" as const;

export function isE2eLs010BootstrapRedirectSuppressed(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return window.sessionStorage.getItem(E2E_LS010_BOOTSTRAP_REDIRECT_SUPPRESS_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}
