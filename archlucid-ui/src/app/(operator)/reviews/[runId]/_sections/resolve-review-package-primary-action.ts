import {
  RUN_DETAIL_GOVERNANCE_CTA_LABEL,
  runDetailGovernanceWorkflowHref,
  shouldShowRunDetailGovernanceCta,
} from "@/lib/run-detail-governance-cta-visibility";

import { resolveReviewPackageSummaryMode } from "./resolve-review-package-summary-mode";

export type ReviewPackagePrimaryActionKind =
  | "review-findings"
  | "add-evidence"
  | "finalize-package"
  | "export-proof-packet"
  | "open-governance-decision";

export type ReviewPackagePrimaryAction = {
  readonly kind: ReviewPackagePrimaryActionKind;
  readonly label: string;
  /** In-page anchor or route href; null when the control is an in-place action (finalize). */
  readonly href: string | null;
};

export type ResolveReviewPackagePrimaryActionInput = {
  readonly runId: string;
  readonly manifestId: string | null | undefined;
  readonly hasCommitBlockingFailures: boolean;
  readonly blockingFindingCount: number;
  readonly buyerPolishedArtifactTable: boolean;
  readonly operatorGovernanceDecision: string | null | undefined;
  readonly manifestStatus: string | null | undefined;
  readonly runCompleted: boolean;
};

const REVIEW_PACKAGE_PRIMARY_ACTION_LABELS: Record<
  Exclude<ReviewPackagePrimaryActionKind, "open-governance-decision">,
  string
> = {
  "review-findings": "Review findings",
  "add-evidence": "Add evidence",
  "finalize-package": "Finalize package",
  "export-proof-packet": "Export proof packet",
};

function reviewFindingsHref(): string {
  return "#run-explanation";
}

function addEvidenceHref(): string {
  return "#capture-evidence";
}

function exportProofPacketHref(): string {
  return "#artifacts-exports";
}

function buildLinkAction(
  kind: Exclude<ReviewPackagePrimaryActionKind, "finalize-package" | "open-governance-decision">,
): ReviewPackagePrimaryAction {
  const hrefByKind: Record<typeof kind, string> = {
    "review-findings": reviewFindingsHref(),
    "add-evidence": addEvidenceHref(),
    "export-proof-packet": exportProofPacketHref(),
  };

  return {
    kind,
    label: REVIEW_PACKAGE_PRIMARY_ACTION_LABELS[kind],
    href: hrefByKind[kind],
  };
}

function buildFinalizeAction(): ReviewPackagePrimaryAction {
  return {
    kind: "finalize-package",
    label: REVIEW_PACKAGE_PRIMARY_ACTION_LABELS["finalize-package"],
    href: null,
  };
}

function buildGovernanceAction(runId: string): ReviewPackagePrimaryAction {
  return {
    kind: "open-governance-decision",
    label: RUN_DETAIL_GOVERNANCE_CTA_LABEL,
    href: runDetailGovernanceWorkflowHref(runId),
  };
}

/** Picks exactly one primary next-action CTA for the Review Package summary header (TB-618). */
export function resolveReviewPackagePrimaryAction(
  input: ResolveReviewPackagePrimaryActionInput,
): ReviewPackagePrimaryAction {
  const mode = resolveReviewPackageSummaryMode(input.manifestId);

  if (input.hasCommitBlockingFailures) {
    return buildLinkAction("review-findings");
  }

  if (mode === "finalized") {
    if (input.blockingFindingCount > 0) {
      return buildLinkAction("review-findings");
    }

    if (
      shouldShowRunDetailGovernanceCta({
        manifestId: input.manifestId,
        buyerPolishedArtifactTable: input.buyerPolishedArtifactTable,
        operatorGovernanceDecision: input.operatorGovernanceDecision,
        manifestStatus: input.manifestStatus,
      })
    ) {
      return buildGovernanceAction(input.runId);
    }

    return buildLinkAction("export-proof-packet");
  }

  if (!input.runCompleted) {
    return buildLinkAction("add-evidence");
  }

  return buildFinalizeAction();
}
