import type { EvidenceOrientationLink } from "@/lib/evidence-surface-copy";
import { isInternalOpsPath } from "@/lib/internal-ops-route-paths";
import { pathMatchesSettingsRoot } from "@/lib/settings-admin-route-paths";

export const WHERE_TO_GO_NEXT_FOLLOW_UPS_TITLE = "Where to go next" as const;

/** True when a follow-up href targets Administration or Internal Operations product routes. */
export function isAdminOrInternalFollowUpHref(href: string): boolean {
  const pathOnly = href.trim().split("#")[0]?.split("?")[0] ?? href.trim();

  if (pathOnly === "/admin" || pathOnly.startsWith("/admin/")) {
    return true;
  }

  if (pathMatchesSettingsRoot(pathOnly) || pathOnly.startsWith("/administration/")) {
    return true;
  }

  return isInternalOpsPath(pathOnly);
}

export function isExcludedFromWhereToGoNextFollowUps(link: EvidenceOrientationLink): boolean {
  if (link.adminOnly === true) {
    return true;
  }

  return isAdminOrInternalFollowUpHref(link.href);
}

/** Where to go next strips omit Administration and Internal Operations — those readers already know the nav. */
export function filterWhereToGoNextFollowUpLinks(
  links: readonly EvidenceOrientationLink[],
): readonly EvidenceOrientationLink[] {
  return links.filter((link) => !isExcludedFromWhereToGoNextFollowUps(link));
}

export function isWhereToGoNextFollowUpsTitle(title: string): boolean {
  return title.trim() === WHERE_TO_GO_NEXT_FOLLOW_UPS_TITLE;
}
