import type { NavGroupWithVisibleLinks } from "@/lib/nav-shell-visibility";

/** Secondary reporting destinations — canonical Outcomes hub covers the same questions. */
const WORKING_MODE_SECONDARY_REPORTING_HREFS = new Set<string>([
  "/insights/architecture-scorecard",
  "/governance/dashboard",
  "/value-report/pilot",
  "/value-report/roi",
]);

export function filterNavGroupsForWorkingProfessionalMode(
  rows: readonly NavGroupWithVisibleLinks[],
): NavGroupWithVisibleLinks[] {
  return rows
    .map((group) => ({
      ...group,
      visibleLinks: group.visibleLinks.filter(
        (link) => !WORKING_MODE_SECONDARY_REPORTING_HREFS.has(link.href),
      ),
    }))
    .filter((group) => group.visibleLinks.length > 0);
}
