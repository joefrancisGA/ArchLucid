import { buildArchitectureWorkspaceTabHref } from "@/lib/architecture/architecture-workspace-tabs";
import { buildReviewDetailTabHref } from "@/lib/review-detail-workspace-tabs";

import {
  resolveReviewPackagePrimaryAction,
  type ResolveReviewPackagePrimaryActionInput,
  type ReviewPackagePrimaryAction,
  type ReviewPackagePrimaryActionKind,
} from "./resolve-review-package-primary-action";

export type ReviewPackageDoThisNextKind =
  | ReviewPackagePrimaryActionKind
  | "answer-clarifications"
  | "view-assessment-progress";

export type ReviewPackageDoThisNext = {
  readonly kind: ReviewPackageDoThisNextKind;
  readonly sentence: string;
  readonly actionLabel: string;
  readonly href: string | null;
  readonly buttonVariant?: "primary" | "outline";
  readonly secondaryAction?: {
    readonly label: string;
    readonly href: string;
  } | null;
};

export type ResolveReviewPackageDoThisNextInput = ResolveReviewPackagePrimaryActionInput & {
  readonly showProgressTracker: boolean;
  readonly openClarificationGapCount: number;
  readonly correctionHref: string | null;
  readonly nextAction?: string | null;
  readonly evidenceCoverageLinkedCount: number;
  readonly evidenceCoverageTotalCount: number;
  readonly governanceDecisionRecorded: boolean;
  /** Create-home uses `archTab=`; committed review workspace uses `reviewTab=` (TB-1831). */
  readonly useCreateHomeWorkspaceTabs: boolean;
};

function clarificationsHref(input: ResolveReviewPackageDoThisNextInput): string {
  if (input.correctionHref !== null && input.correctionHref.trim().length > 0) {
    return input.correctionHref;
  }

  return buildArchitectureWorkspaceTabHref(input.runId, "overview");
}

function viewAssessmentHref(runId: string, useCreateHomeWorkspaceTabs: boolean): string {
  if (useCreateHomeWorkspaceTabs) {
    return buildArchitectureWorkspaceTabHref(runId, "activity");
  }

  return buildReviewDetailTabHref(runId, "activity");
}

function sentenceForPrimaryAction(
  action: ReviewPackagePrimaryAction,
  input: ResolveReviewPackageDoThisNextInput,
): string {
  switch (action.kind) {
    case "add-evidence":
      return "Evidence is still thin — add architecture evidence before expecting full findings.";
    case "review-findings":
      if (input.blockingFindingCount > 0) {
        return input.blockingFindingCount === 1
          ? "One finding still blocks approval or finalization — review it next."
          : `${input.blockingFindingCount} findings still block approval or finalization — review them next.`;
      }

      return "Open findings need your disposition before you can finalize or share this package.";
    case "finalize-package":
      return "Assessment finished — finalize this review to create a signed review record.";
    case "send-to-sponsor":
      return "This package is finalized — download or share the sponsor briefing export when you are ready.";
    case "open-governance-decision":
      return "Governance approval is still pending before this package can move to sponsors.";
    default: {
      const unreachable: never = action.kind;
      throw new Error(`Unhandled primary action kind ${unreachable}.`);
    }
  }
}

function evidenceCoverageGap(input: ResolveReviewPackageDoThisNextInput): boolean {
  return input.evidenceCoverageTotalCount > 0 && input.evidenceCoverageLinkedCount === 0;
}

function evidenceCoverageGapSentence(totalCount: number): string {
  const gap =
    totalCount === 1
      ? "its one open finding has no linked evidence"
      : `none of its ${totalCount} open findings have linked evidence`;

  return `This package is finalized, but ${gap} — review evidence coverage before sharing with a sponsor.`;
}

/** TB-2175: one sentence + one CTA for the current review package lifecycle step. */
export function resolveReviewPackageDoThisNext(
  input: ResolveReviewPackageDoThisNextInput,
): ReviewPackageDoThisNext {
  if (input.showProgressTracker && input.manifestId === null) {
    return {
      kind: "view-assessment-progress",
      sentence: "Assessment is running — follow progress or add evidence while you wait.",
      actionLabel: "View assessment progress",
      href: viewAssessmentHref(input.runId, input.useCreateHomeWorkspaceTabs),
    };
  }

  if (input.openClarificationGapCount > 0 && input.manifestId === null && !input.runCompleted) {
    const gapLabel =
      input.openClarificationGapCount === 1
        ? "One clarifying question is still open"
        : `${input.openClarificationGapCount} clarifying questions are still open`;

    return {
      kind: "answer-clarifications",
      sentence: `${gapLabel} — answer them before assessment confidence improves.`,
      actionLabel: "Answer clarifying questions",
      href: clarificationsHref(input),
    };
  }

  const primaryAction = resolveReviewPackagePrimaryAction({
    ...input,
    nextAction: input.nextAction,
  });

  if (primaryAction.kind === "send-to-sponsor" && evidenceCoverageGap(input)) {
    return {
      kind: primaryAction.kind,
      sentence: evidenceCoverageGapSentence(input.evidenceCoverageTotalCount),
      actionLabel: "Review evidence coverage",
      href: buildReviewDetailTabHref(input.runId, "evidence"),
      buttonVariant: "outline",
      secondaryAction: {
        label: primaryAction.label,
        href: primaryAction.href ?? buildReviewDetailTabHref(input.runId, "review-package", { hash: "sponsor-handoff" }),
      },
    };
  }

  return {
    kind: primaryAction.kind,
    sentence: sentenceForPrimaryAction(primaryAction, input),
    actionLabel: primaryAction.label,
    href: primaryAction.href,
  };
}
