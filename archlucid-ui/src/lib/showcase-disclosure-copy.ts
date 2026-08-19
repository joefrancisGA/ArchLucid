import { CUSTOMER_AUTH_PUBLIC_SAMPLE_NO_SIGN_IN } from "@/lib/auth/customer-auth-messaging";

/** Buyer-safe disclosure title for curated showcase static payloads — never implies a live tenant connection. */
export const SHOWCASE_ILLUSTRATIVE_SAMPLE_TITLE = "Illustrative sample";

/** Intentional static showcase path (no API base or static-only deploy). */
export const SHOWCASE_CURATED_STATIC_DISCLOSURE =
  `Curated demonstration output from the Claims Intake sample scenario. ${CUSTOMER_AUTH_PUBLIC_SAMPLE_NO_SIGN_IN}.`;

/**
 * API transport failed but curated static payload is shown — offline illustrative mode, not a product error.
 */
export const SHOWCASE_OFFLINE_ILLUSTRATIVE_DISCLOSURE =
  "Showing curated demonstration output while the live showcase connection is unavailable.";

/** Guard for tests — visitor-facing showcase banners must not claim a live preview. */
export const SHOWCASE_FORBIDDEN_LIVE_PREVIEW_PHRASES = [
  "live preview unavailable",
  "live preview is not available",
  "static demo preview",
] as const;
