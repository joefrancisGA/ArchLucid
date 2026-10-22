import { productLineDisplayName } from "@/lib/product-line/product-line-display-name";
import type { ProductLineId } from "@/lib/product-line/product-line-id";

/** Canonical copy for the passwordless sign-in route (`/auth/signin`). */
export const AUTH_SIGNIN_PRIMARY_CONTENT_ID = "auth-signin-primary-content" as const;

export const AUTH_SIGNIN_SKIP_LINK_LABEL = "Skip to sign-in content" as const;

/** Fatal AuthErrorPanel title when OIDC/JwtBearer cannot start on `/auth/signin`. */
export const AUTH_SIGNIN_FATAL_ERROR_TITLE = "Sign-in could not start";

export function authSignInPageMetadataTitle(productLineId: ProductLineId): string {
  return `Sign in · ${productLineDisplayName(productLineId)}`;
}

export function authSignInPageMetadataDescription(productLineId: ProductLineId): string {
  const productName = productLineDisplayName(productLineId);

  return `Sign in to ${productName} with your work or school account or a one-time email code.`;
}

/** TB-1313 parity: branded document title for `/auth/signin`. */
export const AUTH_SIGNIN_PAGE_METADATA_TITLE = authSignInPageMetadataTitle("architecture");

export const AUTH_SIGNIN_PAGE_METADATA_DESCRIPTION = authSignInPageMetadataDescription("architecture");

/** TB-1314 parity: Suspense fallback copy while search params hydrate. */
export const AUTH_SIGNIN_LOADING_DETAIL = "Preparing sign-in…";
