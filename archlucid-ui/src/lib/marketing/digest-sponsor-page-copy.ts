export const DIGEST_SPONSOR_PRIMARY_CONTENT_ID = "digest-sponsor-primary-content" as const;

export const DIGEST_SPONSOR_FIRST_VIEWPORT_ID = "digest-sponsor-first-viewport" as const;

export const DIGEST_SPONSOR_SKIP_TARGET_ID = DIGEST_SPONSOR_FIRST_VIEWPORT_ID;

export const DIGEST_SPONSOR_SKIP_LINK_LABEL = "Skip to digest content" as const;

export const DIGEST_SPONSOR_PAGE_EYEBROW = "Weekly sponsor digest" as const;

export const DIGEST_SPONSOR_OVERVIEW_TITLE = "Sponsor digest overview" as const;

export const DIGEST_SPONSOR_COLLATERAL_TITLE = "Sponsor collateral" as const;

export const DIGEST_SPONSOR_LEAD =
  "Read-only snapshot from your weekly digest email — sign in for the full architect workspace." as const;

export const DIGEST_SPONSOR_MISSING_TOKEN_TITLE = "Sponsor digest link" as const;

export const DIGEST_SPONSOR_MISSING_TOKEN_BODY =
  "This read-only link is missing its access token. Open the latest weekly digest email and use the CTA again." as const;

export const DIGEST_SPONSOR_UNAVAILABLE_TITLE = "Sponsor digest link unavailable" as const;

export const DIGEST_SPONSOR_UNAVAILABLE_BODY =
  "This read-only digest link is invalid, expired, or no longer available." as const;

export const DIGEST_SPONSOR_COLLATERAL_MISSING_TOKEN_TITLE = "Sponsor collateral link" as const;

export const DIGEST_SPONSOR_COLLATERAL_MISSING_TOKEN_BODY =
  "This read-only collateral link is missing its access token. Open the latest weekly digest email and use the review CTA again." as const;

export const DIGEST_SPONSOR_COLLATERAL_UNAVAILABLE_TITLE = "Sponsor collateral unavailable" as const;

export const DIGEST_SPONSOR_COLLATERAL_UNAVAILABLE_BODY =
  "This read-only collateral link is invalid, expired, or no longer available for this review." as const;

export const DIGEST_SPONSOR_SIGN_IN_LABEL = "Sign in" as const;

export const DIGEST_SPONSOR_SIGN_IN_WORKSPACE_LABEL = "Sign in to open the full workspace" as const;

export const DIGEST_SPONSOR_HIGHLIGHTED_REVIEWS_HEADING = "Highlighted reviews" as const;

export const DIGEST_SPONSOR_COMMITTED_PACKAGES_PREFIX = "Architecture packages committed this period:" as const;

/** Post-auth return path for sponsor run collateral deep links (DIU). */
export function buildDigestSponsorRunCollateralReturnPath(runIdHex: string, token: string): string {
  const normalizedRunIdHex = runIdHex.trim().replace(/-/g, "");
  const trimmedToken = token.trim();

  return `/digest/sponsor/run/${encodeURIComponent(normalizedRunIdHex)}?token=${encodeURIComponent(trimmedToken)}`;
}
