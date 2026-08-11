import {
  RUN_DETAIL_GOVERNANCE_CTA_LABEL,
  runDetailGovernanceWorkflowHref,
  shouldShowRunDetailGovernanceCta,
} from "@/lib/run-detail-governance-cta-visibility";

import { buildReviewDetailTabHref } from "@/lib/review-detail-workspace-tabs";
import { shortenNextActionForPrimaryCta } from "@/lib/run-detail-workspace-derive";

import { resolveReviewPackageSummaryMode } from "./resolve-review-package-summary-mode";

export type ReviewPackagePrimaryActionKind =
  | "review-findings"
  | "add-evidence"
  | "finalize-package"
  | "send-to-sponsor"
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
  readonly nextAction?: string | null;
};

const REVIEW_PACKAGE_PRIMARY_ACTION_LABELS: Record<
  Exclude<ReviewPackagePrimaryActionKind, "open-governance-decision">,
  string
> = {
  "review-findings": "Review findings",
  "add-evidence": "Add evidence",
  "finalize-package": "Finalize review",
  "send-to-sponsor": "Send to sponsor",
};

function reviewFindingsHref(runId: string): string {
  return buildReviewDetailTabHref(runId, "findings");
}

function addEvidenceHref(runId: string): string {
  return buildReviewDetailTabHref(runId, "evidence");
}

function sendToSponsorHref(runId: string): string {
  return buildReviewDetailTabHref(runId, "review-package", { hash: "sponsor-handoff" });
}

function buildLinkAction(
  runId: string,
  kind: Exclude<ReviewPackagePrimaryActionKind, "finalize-package" | "open-governance-decision">,
): ReviewPackagePrimaryAction {
  const hrefByKind: Record<typeof kind, string> = {
    "review-findings": reviewFindingsHref(runId),
    "add-evidence": addEvidenceHref(runId),
    "send-to-sponsor": sendToSponsorHref(runId),
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

/**
 * Only findings-tab CTAs may inherit the decision-snapshot next-action phrasing.
 * Governance / sponsor / finalize labels must stay aligned with their href targets.
 */
function applyNextActionLabelForFindings(
  action: ReviewPackagePrimaryAction,
  nextAction: string | null | undefined,
): ReviewPackagePrimaryAction {
  if (action.kind !== "review-findings") {
    return action;
  }

  const shortened = shortenNextActionForPrimaryCta(nextAction ?? "");

  if (shortened === null) {
    return action;
  }

  return {
    ...action,
    label: shortened,
  };
}

/** Picks exactly one primary next-action CTA for the Review Package summary header (TB-618). */
export function resolveReviewPackagePrimaryAction(
  input: ResolveReviewPackagePrimaryActionInput,
): ReviewPackagePrimaryAction {
  const mode = resolveReviewPackageSummaryMode(input.manifestId);

  if (input.hasCommitBlockingFailures) {
    return applyNextActionLabelForFindings(
      buildLinkAction(input.runId, "review-findings"),
      input.nextAction,
    );
  }

  if (mode === "finalized") {
    if (input.blockingFindingCount > 0) {
      return applyNextActionLabelForFindings(
        buildLinkAction(input.runId, "review-findings"),
        input.nextAction,
      );
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

    return buildLinkAction(input.runId, "send-to-sponsor");
  }

  if (!input.runCompleted) {
    return buildLinkAction(input.runId, "add-evidence");
  }

  return buildFinalizeAction();
}
