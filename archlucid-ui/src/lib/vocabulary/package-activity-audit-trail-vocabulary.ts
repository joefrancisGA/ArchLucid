/**
 * TB-2305 — Package Activity ≠ Audit trail vocabulary rail.
 *
 * Why two surfaces exist:
 * - Package Activity (`?archTab=activity` / `?reviewTab=activity`) is assessment
 *   progress for one architecture package — pipeline stages and review activity
 *   on that package.
 * - Audit trail (`/governance/audit`) is the operator activity log for
 *   governance and review events across the workspace (filters, integrity
 *   export/verify).
 *
 * They stay separate because package assessment progress is not the operator
 * audit log. Distinct from Audit trail ≠ Evidence graph / Search (TB-2255).
 */

import { REVIEWS_LIST_PATH } from "@/lib/architecture/architecture-routes";
import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";
import { createExternalPeerPairwiseVocabularyRail } from "@/lib/vocabulary/create-pairwise-vocabulary-rail";

export type PackageActivityAuditTrailSurfaceId = "package-activity" | "audit-trail";

export type PackageActivityAuditTrailLink = {
  readonly id: PackageActivityAuditTrailSurfaceId;
  readonly label: string;
  readonly href: string;
  readonly whenToUse: string;
};

export type PackageActivityAuditTrailVocabularyModel = {
  readonly heading: string;
  readonly whyTwo: string;
  readonly compactLine: string;
  readonly packageActivityLink: PackageActivityAuditTrailLink;
  readonly auditTrailLink: PackageActivityAuditTrailLink;
};

export const PACKAGE_ACTIVITY_AUDIT_TRAIL_HEADING =
  "Package Activity and Audit trail serve different purposes" as const;

export const PACKAGE_ACTIVITY_AUDIT_TRAIL_WHY_TWO =
  "Package Activity shows progress on one architecture review — pipeline stages and review events on that review. Audit trail is the workspace-wide activity log for governance and review events. Watching one review's progress is not the same as searching the workspace log." as const;

export const PACKAGE_ACTIVITY_AUDIT_TRAIL_COMPACT_LINE =
  "Package Activity is progress on one review; Audit trail is the workspace activity log." as const;

/**
 * Peer from Audit trail without a run: Reviews hub, because Activity is
 * package-scoped (open the Activity tab on a package from the list).
 */
export const PACKAGE_ACTIVITY_AUDIT_TRAIL_REVIEWS_PEER_LINK: PackageActivityAuditTrailLink =
  {
    id: "package-activity",
    label: "Reviews (open Activity)",
    href: REVIEWS_LIST_PATH,
    whenToUse: "Open an architecture package, then use Activity for assessment progress.",
  };

export const PACKAGE_ACTIVITY_AUDIT_TRAIL_AUDIT_LINK: PackageActivityAuditTrailLink = {
  id: "audit-trail",
  label: "Audit trail",
  href: GOVERNANCE_AUDIT_PATH,
  whenToUse: "Search the operator activity log for governance and review events.",
};

/** Build vocabulary; pass runId when mounting on a package Activity tab. */
export function buildPackageActivityAuditTrailPairwiseRail(runId?: string | null) {
  return createExternalPeerPairwiseVocabularyRail({
    runId,
    reviewSurfaceId: "package-activity",
    externalSurfaceId: "audit-trail",
    reviewTabId: "activity",
    copy: {
      heading: PACKAGE_ACTIVITY_AUDIT_TRAIL_HEADING,
      whyTwo: PACKAGE_ACTIVITY_AUDIT_TRAIL_WHY_TWO,
      compactLine: PACKAGE_ACTIVITY_AUDIT_TRAIL_COMPACT_LINE,
      reviewSideLabel: "Activity",
      reviewSideWhenToUse: "Follow assessment progress for this architecture package.",
    },
    reviewsPeerFallbackLink: PACKAGE_ACTIVITY_AUDIT_TRAIL_REVIEWS_PEER_LINK,
    externalPeerLinkBase: PACKAGE_ACTIVITY_AUDIT_TRAIL_AUDIT_LINK,
    buildExternalPeerHref: (scopedRunId) =>
      `${GOVERNANCE_AUDIT_PATH}?runId=${encodeURIComponent(scopedRunId)}`,
  });
}

/** Build vocabulary; pass runId when mounting on a package Activity tab. */
export function buildPackageActivityAuditTrailVocabulary(
  runId?: string | null,
): PackageActivityAuditTrailVocabularyModel {
  const rail = buildPackageActivityAuditTrailPairwiseRail(runId);

  return {
    heading: rail.heading,
    whyTwo: rail.whyTwo,
    compactLine: rail.compactLine,
    packageActivityLink: rail.reviewSideLink,
    auditTrailLink: rail.externalPeerLink,
  };
}

/** Peer deep-link for the surface you are not currently on. */
export function resolvePackageActivityAuditTrailPeerLink(
  currentSurfaceId: PackageActivityAuditTrailSurfaceId,
  model: PackageActivityAuditTrailVocabularyModel,
): PackageActivityAuditTrailLink {
  if (currentSurfaceId === "package-activity") {
    return model.auditTrailLink;
  }

  return model.packageActivityLink;
}
