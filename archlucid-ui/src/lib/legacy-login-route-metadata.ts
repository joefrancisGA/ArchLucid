import type { Metadata } from "next";

/**
 * Legacy `/login` is a redirect shim — not a discoverable sign-in product page (TB-1793).
 */
export const LEGACY_LOGIN_ROUTE_METADATA: Metadata = {
  title: "Redirecting to sign in",
  description:
    "Legacy /login bookmark — redirects immediately to the canonical sign-in route (/auth/signin).",
  robots: { index: false, follow: false },
};
