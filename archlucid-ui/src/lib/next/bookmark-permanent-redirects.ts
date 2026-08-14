import type { Redirect } from "next/dist/lib/load-custom-routes";

/**
 * TB-2234 / TB-2236 — Allowlisted permanent bookmark redirects.
 * IA batch 4 retired blanket next.config redirects; these rows are explicit owner-approved shims only.
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
    source: "/try",
    destination: "/see-it",
    permanent: true,
  },
  {
    source: "/live-demo",
    destination: "/see-it",
    permanent: true,
  },
  {
    source: "/live-demo/:path*",
    destination: "/see-it",
    permanent: true,
  },
  {
    source: "/demo/preview",
    destination: "/see-it",
    permanent: true,
  },
  {
    source: "/demo/preview/:path*",
    destination: "/see-it",
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
];

export const BOOKMARK_PERMANENT_REDIRECT_SOURCES: readonly string[] = BOOKMARK_PERMANENT_REDIRECTS.map(
  (rule) => rule.source,
);
