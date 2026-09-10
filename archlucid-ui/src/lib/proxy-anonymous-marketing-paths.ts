function isPreAuthSignInAnonymousProxyPath(normalized: string): boolean {
  return (
    normalized === "v1/auth/routing/evaluate" ||
    normalized === "v1/auth/email-otp/challenge" ||
    normalized === "v1/auth/email-otp/verify" ||
    normalized === "v1/auth/invitations/validate"
  );
}

function isAnonymousMarketingProxyPathNormalized(normalized: string): boolean {
  return (
    normalized === "v1/marketing/quick-scan" ||
    normalized.startsWith("v1/marketing/quick-scan/") ||
    normalized.startsWith("v1/marketing/showcase/") ||
    normalized === "v1/marketing/pricing/quote-request" ||
    normalized === "v1/marketing/early-access" ||
    normalized === "v1/marketing/why-archlucid-pack.pdf" ||
    normalized === "v1/marketing/enterprise-comparison.pdf" ||
    normalized === "v1/marketing/sponsor-brief.pdf" ||
    normalized === "v1/marketing/trust-center/evidence-pack.zip" ||
    normalized.startsWith("v1/marketing/trust-center/")
  );
}

/** Upstream paths that must not receive the server-side proxy bearer token (TB-895). */
export function isAnonymousMarketingProxyPath(proxyPath: string): boolean {
  const normalized = proxyPath.trim().toLowerCase();

  if (normalized.length === 0) {
    return false;
  }

  return isAnonymousMarketingProxyPathNormalized(normalized);
}

/** Marketing plus pre-sign-in `[AllowAnonymous]` auth routes that bypass BFF mutation gates (LK-07). */
export function isPublicAnonymousProxyPath(proxyPath: string): boolean {
  const normalized = proxyPath.trim().toLowerCase();

  if (normalized.length === 0) {
    return false;
  }

  return (
    isAnonymousMarketingProxyPathNormalized(normalized) ||
    isPreAuthSignInAnonymousProxyPath(normalized)
  );
}
