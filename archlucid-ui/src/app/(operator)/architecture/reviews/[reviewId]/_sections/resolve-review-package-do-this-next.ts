import { buildReviewWorkspaceTabHref } from "@/lib/unified-review-workspace-tabs";
import { resolveClarificationsFindingsLoopNext } from "@/lib/review-clarifications-findings-loop";
import {
  reviewLifecycleNextActionInstance,
  reviewLifecycleNextActionLabel,
  type BuildReviewLifecycleNextActionHrefInput,
} from "@/lib/review-lifecycle-next-action-registry";

import {
  resolveReviewPackagePrimaryAction,
  type ResolveReviewPackagePrimaryActionInput,
  type ReviewPackagePrimaryAction,
  type ReviewPackagePrimaryActionKind,
} from "./resolve-review-package-primary-action";

export type ReviewPackageDoThisNextKind =
  | ReviewPackagePrimaryActionKind
  | "answer-clarifications"
  | "view-assessment-progress"
  | "compare-to-prior";

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
  readonly findingsCount?: number;
  readonly correctionHref: string | null;
  readonly nextAction?: string | null;
  readonly evidenceCoverageLinkedCount: number;
  readonly evidenceCoverageTotalCount: number;
  readonly governanceDecisionRecorded: boolean;
  /** Create-home and committed review workspace both use canonical `reviewTab=` (TB-2363). */
  readonly useCreateHomeWorkspaceTabs: boolean;
  /** Compare href when a prior package on the same request is already comparable. */
  readonly compareWithPriorHref?: string | null;
};

function clarificationsHref(input: ResolveReviewPackageDoThisNextInput): string {
  if (input.correctionHref !== null && input.correctionHref.trim().length > 0) {
    return input.correctionHref;
  }

  return buildReviewWorkspaceTabHref(input.runId, "overview");
}

function viewAssessmentHref(runId: string): string {
  return buildReviewWorkspaceTabHref(runId, "activity");
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
      return "Assessment finished — finalize this review to create a sealed review record.";
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

function registryHrefInput(input: ResolveReviewPackageDoThisNextInput): BuildReviewLifecycleNextActionHrefInput {
  return {
    runId: input.runId,
    showCompareCta: true,
    hasManifest: input.manifestId !== null && input.manifestId !== undefined && input.manifestId.trim().length > 0,
    correctionHref: input.correctionHref,
  };
}

/** Post-finalize compare / second-review labels from the lifecycle registry (TB-2366). */
export function resolveReviewPackageDoThisNextFromRegistry(
  input: ResolveReviewPackageDoThisNextInput,
  primaryAction: ReviewPackagePrimaryAction,
): ReviewPackageDoThisNext | null {
  const compareWithPriorHref = input.compareWithPriorHref?.trim() ?? "";

  if (
    compareWithPriorHref.length > 0 &&
    input.runCompleted &&
    input.blockingFindingCount === 0 &&
    (primaryAction.kind === "send-to-sponsor" || primaryAction.kind === "finalize-package")
  ) {
    const compareAction = reviewLifecycleNextActionInstance({
      id: "compare",
      hrefInput: registryHrefInput(input),
      hrefOverride: compareWithPriorHref,
    });

    return {
      kind: "compare-to-prior",
      sentence: "This package can be compared to the prior review — confirm what changed before sharing.",
      actionLabel: compareAction?.label ?? reviewLifecycleNextActionLabel("compare"),
      href: compareWithPriorHref,
      secondaryAction:
        primaryAction.href !== null && primaryAction.href !== undefined
          ? { label: primaryAction.label, href: primaryAction.href }
          : null,
    };
  }

  return null;
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
      href: viewAssessmentHref(input.runId),
    };
  }

  if (input.manifestId === null && !input.runCompleted) {
    const loopNext = resolveClarificationsFindingsLoopNext({
      openClarificationGapCount: input.openClarificationGapCount,
      findingsCount: input.findingsCount ?? 0,
    });

    if (loopNext !== null && input.openClarificationGapCount > 0) {
      const clarificationsAction = reviewLifecycleNextActionInstance({
        id: "answer-clarifications",
        hrefInput: registryHrefInput(input),
      });

      return {
        kind: "answer-clarifications",
        sentence: loopNext.sentence,
        actionLabel: clarificationsAction?.label ?? reviewLifecycleNextActionLabel("answer-clarifications"),
        href: clarificationsAction?.href ?? clarificationsHref(input),
      };
    }

    if (loopNext !== null && input.openClarificationGapCount === 0 && (input.findingsCount ?? 0) > 0) {
      return {
        kind: "review-findings",
        sentence: loopNext.sentence,
        actionLabel: reviewLifecycleNextActionLabel("triage-findings"),
        href: buildReviewWorkspaceTabHref(input.runId, loopNext.nextTabId),
      };
    }
  }

  const primaryAction = resolveReviewPackagePrimaryAction({
    ...input,
    nextAction: input.nextAction,
  });

  const registryNext = resolveReviewPackageDoThisNextFromRegistry(input, primaryAction);

  if (registryNext !== null) {
    return registryNext;
  }

  if (primaryAction.kind === "send-to-sponsor" && evidenceCoverageGap(input)) {
    return {
      kind: primaryAction.kind,
      sentence: evidenceCoverageGapSentence(input.evidenceCoverageTotalCount),
      actionLabel: "Review evidence coverage",
      href: buildReviewWorkspaceTabHref(input.runId, "evidence"),
      buttonVariant: "outline",
      secondaryAction: {
        label: primaryAction.label,
        href: primaryAction.href ?? buildReviewWorkspaceTabHref(input.runId, "review-package", { hash: "sponsor-handoff" }),
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
