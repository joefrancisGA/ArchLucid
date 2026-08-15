import { reviewDetailPath } from "@/lib/architecture/architecture-routes";
import { DECISION_REGISTER_CANONICAL_PATH } from "@/lib/decision-register-evidence-copy";
import { getFindingDetailHref } from "@/lib/findings/finding-evidence-navigation";
import { GOVERNANCE_APPROVAL_QUEUE_PATH } from "@/lib/governance/governance-route-paths";
import { signedRecordDetailPath } from "@/lib/signed-records-paths";

/** Governed operator objects with a single canonical home route (TB-2153 / TB-1026). */
export type GovernedObjectType = "finding" | "decision" | "sealedReviewRecord" | "approvalRequest";

/** Surfaces where governed objects may appear without being at canonical home. */
export type SecondaryAppearanceSurface =
  | "governanceFindingsRegister"
  | "reviewPackageFindingsTab"
  | "reviewPackageGovernanceTab"
  | "reviewPackageAuthorityChain"
  | "findingEvidenceTrace"
  | "governanceApprovalInspector";

export type CanonicalObjectHomeParams = {
  readonly runId?: string;
  readonly findingId?: string;
  readonly manifestId?: string;
  readonly approvalRequestId?: string;
};

export type CanonicalObjectSecondaryViewPresentation = {
  readonly objectType: GovernedObjectType;
  readonly surface: SecondaryAppearanceSurface;
  readonly homeHref: string;
  readonly surfaceLabel: string;
  readonly homeActionLabel: string;
};

/** Human label for the secondary surface the operator is browsing from. */
export function secondaryAppearanceSurfaceLabel(surface: SecondaryAppearanceSurface): string {
  switch (surface) {
    case "governanceFindingsRegister":
      return "Findings register";
    case "reviewPackageFindingsTab":
      return "Architecture review findings";
    case "reviewPackageGovernanceTab":
      return "Architecture review governance";
    case "reviewPackageAuthorityChain":
      return "Architecture review authority chain";
    case "findingEvidenceTrace":
      return "Evidence trace";
    case "governanceApprovalInspector":
      return "Governance inspector preview";
    default: {
      const exhaustive: never = surface;

      return exhaustive;
    }
  }
}

/** Link label for the canonical home of a governed object type. */
export function canonicalObjectHomeActionLabel(objectType: GovernedObjectType): string {
  switch (objectType) {
    case "finding":
      return "finding record";
    case "decision":
      return "decision register";
    case "sealedReviewRecord":
      return "sealed review record";
    case "approvalRequest":
      return "approval queue";
    default: {
      const exhaustive: never = objectType;

      return exhaustive;
    }
  }
}

/** Canonical detail path for an approval request workflow record. */
export function governanceApprovalRequestLineagePath(approvalRequestId: string): string {
  return `/governance/approval-requests/${encodeURIComponent(approvalRequestId.trim())}/lineage`;
}

/** Canonical home href for a governed object — throws when required ids are missing. */
export function canonicalObjectHomeHref(
  objectType: GovernedObjectType,
  params: CanonicalObjectHomeParams,
): string {
  switch (objectType) {
    case "finding": {
      const runId = params.runId?.trim() ?? "";
      const findingId = params.findingId?.trim() ?? "";

      if (runId.length === 0 || findingId.length === 0) {
        throw new Error("finding canonical home requires runId and findingId");
      }

      return getFindingDetailHref(runId, findingId);
    }
    case "decision":
      return DECISION_REGISTER_CANONICAL_PATH;
    case "sealedReviewRecord": {
      const manifestId = params.manifestId?.trim() ?? "";

      if (manifestId.length === 0) {
        throw new Error("sealedReviewRecord canonical home requires manifestId");
      }

      return signedRecordDetailPath(manifestId);
    }
    case "approvalRequest": {
      const approvalRequestId = params.approvalRequestId?.trim() ?? "";

      if (approvalRequestId.length > 0) {
        return governanceApprovalRequestLineagePath(approvalRequestId);
      }

      const runId = params.runId?.trim() ?? "";

      if (runId.length > 0) {
        return `${GOVERNANCE_APPROVAL_QUEUE_PATH}?runId=${encodeURIComponent(runId)}#governance-approval-requests`;
      }

      return GOVERNANCE_APPROVAL_QUEUE_PATH;
    }
    default: {
      const exhaustive: never = objectType;

      return exhaustive;
    }
  }
}

/** Review package spine — used when decision register links need package context. */
export function reviewPackageHomeHref(runId: string): string {
  return reviewDetailPath(runId);
}

/** Builds strip copy + home link for a secondary governed-object appearance. */
export function buildCanonicalObjectSecondaryView(
  objectType: GovernedObjectType,
  surface: SecondaryAppearanceSurface,
  params: CanonicalObjectHomeParams,
): CanonicalObjectSecondaryViewPresentation {
  return {
    objectType,
    surface,
    homeHref: canonicalObjectHomeHref(objectType, params),
    surfaceLabel: secondaryAppearanceSurfaceLabel(surface),
    homeActionLabel: canonicalObjectHomeActionLabel(objectType),
  };
}

/** Maps a governance queue row to its secondary-view presentation on the findings register. */
export function secondaryViewFromGovernanceQueueRow(
  row: { readonly recordKind: "finding" | "decision"; readonly runId: string; readonly findingId: string },
): CanonicalObjectSecondaryViewPresentation {
  if (row.recordKind === "decision") {
    return buildCanonicalObjectSecondaryView("decision", "governanceFindingsRegister", {});
  }

  return buildCanonicalObjectSecondaryView("finding", "governanceFindingsRegister", {
    runId: row.runId,
    findingId: row.findingId,
  });
}

/** Golden-path secondary surfaces that must expose a canonical-home link (Vitest inventory). */
export const GOLDEN_PATH_SECONDARY_OBJECT_SURFACES: readonly {
  readonly id: string;
  readonly objectType: GovernedObjectType;
  readonly surface: SecondaryAppearanceSurface;
  readonly hostTestId: string;
}[] = [
  {
    id: "governance-findings-queue",
    objectType: "finding",
    surface: "governanceFindingsRegister",
    hostTestId: "governance-findings-secondary-view-strip",
  },
  {
    id: "review-package-findings-tab",
    objectType: "finding",
    surface: "reviewPackageFindingsTab",
    hostTestId: "review-findings-secondary-view-strip",
  },
  {
    id: "review-package-governance-tab",
    objectType: "decision",
    surface: "reviewPackageGovernanceTab",
    hostTestId: "review-governance-secondary-view-strip",
  },
  {
    id: "review-package-authority-chain",
    objectType: "sealedReviewRecord",
    surface: "reviewPackageAuthorityChain",
    hostTestId: "review-authority-secondary-view-strip",
  },
  {
    id: "finding-evidence-trace",
    objectType: "finding",
    surface: "findingEvidenceTrace",
    hostTestId: "evidence-trace-secondary-view-strip",
  },
  {
    id: "governance-approval-inspector",
    objectType: "approvalRequest",
    surface: "governanceApprovalInspector",
    hostTestId: "governance-approval-inspector-secondary-view-strip",
  },
] as const;
