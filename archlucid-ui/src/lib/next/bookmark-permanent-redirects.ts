import type { Redirect } from "next/dist/lib/load-custom-routes";

/**
 * TB-2234 / TB-2236 — Allowlisted permanent bookmark redirects.
 * IA batch 4 retired blanket next.config redirects; these rows are explicit owner-approved shims only.
 *
 * The retired try-it routes (`/try`, `/live-demo`, `/demo/preview`) are deliberately absent: they
 * were never durable bookmarks, so they 404 instead of costing every visitor a redirect hop.
 */
export const BOOKMARK_PERMANENT_REDIRECTS: Redirect[] = [
  {
    source: "/runs/:reviewId",
    destination: "/architecture/reviews/:reviewId",
    permanent: true,
  },
  {
    source: "/runs/:reviewId/:path*",
    destination: "/architecture/reviews/:reviewId/:path*",
    permanent: true,
  },
  {
    source: "/signed-records",
    destination: "/governance/sealed-records",
    permanent: true,
  },
  {
    source: "/signed-records/:path*",
    destination: "/governance/sealed-records/:path*",
    permanent: true,
  },
  {
    source: "/governance/signed-records",
    destination: "/governance/sealed-records",
    permanent: true,
  },
  {
    source: "/governance/signed-records/:path*",
    destination: "/governance/sealed-records/:path*",
    permanent: true,
  },
  {
    source: "/security-trust",
    destination: "/assurance-status",
    permanent: true,
  },
];

export const BOOKMARK_PERMANENT_REDIRECT_SOURCES: readonly string[] = BOOKMARK_PERMANENT_REDIRECTS.map(
  (rule) => rule.source,
);
