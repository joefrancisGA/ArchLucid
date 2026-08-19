/**
 * TB-2052 — secondary-hub inventory for Learn more job-match Vitest.
 * Paths must not resolve Learn more to getting-started
 * unless they appear on PAGE_HELP_FIRST_RUN_GENERIC_LEARN_MORE_ALLOWLIST_PREFIXES.
 */

/** Canonical secondary hubs from TB-2050 / TB-2052 acceptance. */
export const LEARN_MORE_JOB_MATCH_SECONDARY_HUB_PATHS = [
  "/architecture/digests",
  "/digests",
  "/insights/improvement-planning",
  "/insights/improvement-planning/plans/plan-1",
  "/governance/decision-register",
  "/governance/advisory-scans",
  "/insights/impact-preview",
] as const;

export type LearnMoreJobMatchSecondaryHubPath =
  (typeof LEARN_MORE_JOB_MATCH_SECONDARY_HUB_PATHS)[number];

export const GENERIC_LEARN_MORE_SLUGS = ["getting-started"] as const;

export function isGenericLearnMoreSlug(slug: string | undefined): boolean {
  if (slug == null || slug.length === 0) {
    return false;
  }

  return (GENERIC_LEARN_MORE_SLUGS as readonly string[]).includes(slug);
}
