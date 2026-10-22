import { productLineDisplayName, productLinePasswordlessExplanation } from "@/lib/product-line/product-line-display-name";
import type { ProductLineId } from "@/lib/product-line/product-line-id";

/** Operator app home — keeps return-home on the app host instead of marketing `/welcome`. */
export const SESSION_EXPIRED_SECONDARY_EXIT_PATH = "/" as const;

export function sessionExpiredSecondaryExitLabel(productLineId: ProductLineId): string {
  return `Back to ${productLineDisplayName(productLineId)}`;
}

/** @deprecated Architecture default — use {@link sessionExpiredSecondaryExitLabel}. */
export const SESSION_EXPIRED_SECONDARY_EXIT_LABEL = sessionExpiredSecondaryExitLabel("architecture");

export function sessionExpiredPageMetadataTitle(productLineId: ProductLineId): string {
  return `Session expired · ${productLineDisplayName(productLineId)}`;
}

export function sessionExpiredPageMetadataDescription(productLineId: ProductLineId): string {
  const productName = productLineDisplayName(productLineId);

  return `Your ${productName} session ended. Sign in again to continue, or return to the ${productName} home page.`;
}

/** TB-1313: branded document title for `/auth/session-expired`. */
export const SESSION_EXPIRED_PAGE_METADATA_TITLE = sessionExpiredPageMetadataTitle("architecture");

export const SESSION_EXPIRED_PAGE_METADATA_DESCRIPTION = sessionExpiredPageMetadataDescription("architecture");

/** TB-1314: Suspense fallback copy while search params hydrate. */
export const SESSION_EXPIRED_LOADING_DETAIL = "Preparing session recovery…";

export const SESSION_EXPIRED_PAGE_TITLE = "Session expired" as const;

export const SESSION_EXPIRED_PRIMARY_CONTENT_ID = "session-expired-primary-content" as const;

export const SESSION_EXPIRED_FIRST_VIEWPORT_ID = "session-expired-first-viewport" as const;

export const SESSION_EXPIRED_SKIP_TARGET_ID = SESSION_EXPIRED_FIRST_VIEWPORT_ID;

export const SESSION_EXPIRED_SKIP_LINK_LABEL = "Skip to session recovery content" as const;

export function sessionExpiredPasswordlessExplanation(productLineId: ProductLineId): string {
  return productLinePasswordlessExplanation(productLineId);
}

/** @deprecated Use {@link sessionExpiredPasswordlessExplanation}. */
export const SESSION_EXPIRED_PASSWORDLESS_EXPLANATION = sessionExpiredPasswordlessExplanation("architecture");

export const SESSION_EXPIRED_SIGN_OUT_DISCLOSURE_LABEL = "When you were signed out";

/** Framed for idle-timeout recovery when OIDC cannot start — not "Access request" (TB-1316). */
export const SESSION_EXPIRED_SIGN_IN_ERROR_TITLE = "Sign-in could not start";
