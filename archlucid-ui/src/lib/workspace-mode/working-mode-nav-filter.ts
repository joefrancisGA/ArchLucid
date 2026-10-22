import type { NavGroupWithVisibleLinks } from "@/lib/nav-shell-visibility";

export const WORKING_MODE_SECONDARY_REPORTING_HREFS = new Set<string>([
  "/insights/architecture-scorecard",
  "/insights/roi-summary",
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
