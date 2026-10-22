/**
 * Help catch-all caching contract (TB-1600).
 * Buyer topics prerender via `generateStaticParams` + ISR; internal-runbook bearer checks stay request-time only.
 *
 * Next.js requires a literal `export const revalidate` in `help/[...topic]/page.tsx` — keep the numeric value in sync here.
 */
export const HELP_TOPIC_ROUTE_REVALIDATE_SECONDS = 3600;

/** Layout segment stays static — see `help/layout.tsx` and `operator-static-route-policy.ts`. */
export const HELP_TOPIC_LAYOUT_DYNAMIC = "force-static" as const;
