import { buildReviewWorkspaceTabHref } from "@/lib/unified-review-workspace-tabs";
import { resolveClarificationsFindingsLoopNext } from "@/lib/review-clarifications-findings-loop";
import { isReviewPipelineTerminalFailure } from "@/lib/review-pipeline-terminal-state";
import { buildInviteReviewerHref, INVITE_REVIEWER_PAGE_TITLE } from "@/lib/invite-reviewer-flow";
import { buildCompareTwoReviewsHref } from "@/lib/compare-two-reviews-route";
import { SPONSOR_REPORT_PATH } from "@/lib/sponsor-report-navigation";
import { secondReviewFromPriorHref } from "@/lib/second-review-prior-package";
import { SPONSOR_BRIEFING_EXPORT_LABEL } from "@/lib/usability/canonical-product-terms";
import {
  reviewLifecycleNextActionInstance,
  reviewLifecycleNextActionLabel,
  type BuildReviewLifecycleNextActionHrefInput,
} from "@/lib/review-lifecycle-next-action-registry";
import type { RunDetailLastFailureSummary } from "@/components/resolve-run-detail-last-failure-summary";
import { resolveReviewFailureDoThisNextSentence } from "@/lib/resolve-review-failure-do-this-next-copy";
import {
  resolveReviewFailureRecoveryGuidance,
  type ReviewFailureRecoveryGuidance,
} from "@/lib/resolve-review-failure-recovery-guidance";
import type { ReviewPipelineDiagnosticContext } from "@/lib/review-pipeline-stall-diagnosis";
import type { RunSummary } from "@/types/authority";

import {
  resolveReviewPackagePrimaryAction,
  type ResolveReviewPackagePrimaryActionInput,
  type ReviewPackagePrimaryAction,
  type ReviewPackagePrimaryActionKind,
} from "./resolve-review-package-primary-action";
import { buildReviewPackageRerunHref } from "./resolve-review-package-approval-blocker";

export type ReviewPackageDoThisNextKind =
  | ReviewPackagePrimaryActionKind
  | "answer-clarifications"
  | "view-assessment-progress"
  | "rerun-review"
  | "compare-to-prior";

export type ReviewPackageDoThisNextQuickLink = {
  readonly label: string;
  readonly href: string;
};

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
  readonly quickLinks?: readonly ReviewPackageDoThisNextQuickLink[];
  readonly failureRecovery?: ReviewFailureRecoveryGuidance | null;
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
  readonly legacyRunStatus?: string | null;
  readonly isDeadLettered?: boolean | null;
  readonly pipelineDiagnosticContext?: ReviewPipelineDiagnosticContext | null;
  readonly lastFailureSummary?: RunDetailLastFailureSummary | null;
  readonly pipelineSummary?: RunSummary | null;
  readonly intakeDescription?: string | null;
  readonly intakeSystemName?: string | null;
  readonly canConfigureWorkspaceAi?: boolean;
  readonly realModeFellBackToSimulator?: boolean | null;
  readonly usesCustomerAiConnection?: boolean;
  readonly effectiveSessionMode?: "Simulator" | "Real" | null;
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

function resolveRerunHref(input: ResolveReviewPackageDoThisNextInput): string {
  const correctionHref = input.correctionHref?.trim() ?? "";

  if (correctionHref.length > 0) {
    return correctionHref;
  }

  return buildReviewPackageRerunHref(input.runId);
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

      return "Resolve or assign all open findings before you finalize or share this review.";
    case "finalize-package":
      return "Assessment finished — finalize this review to create a finalized review record.";
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

function buildReviewWorkspaceOverviewHref(runId: string): string {
  return buildReviewWorkspaceTabHref(runId, "overview");
}

function resolveFailureRecoverySecondaryAction(
  input: ResolveReviewPackageDoThisNextInput,
  failureRecovery: ReviewFailureRecoveryGuidance,
): { readonly label: string; readonly href: string } | null {
  const workspaceAiSignal = failureRecovery.workspaceAiConfigurationSignal;

  if (workspaceAiSignal !== null && workspaceAiSignal !== undefined && input.canConfigureWorkspaceAi === true) {
    const adminLink = failureRecovery.adminConfigurationHref?.trim() ?? "";

    if (adminLink.length > 0) {
      return {
        label: failureRecovery.adminConfigurationLabel ?? "Open workspace AI settings",
        href: adminLink,
      };
    }

    return {
      label: "Open workspace AI settings",
      href: "/administration/workspace-settings",
    };
  }

  if (
    failureRecovery.submittedIntakeRecap !== null
    && failureRecovery.submittedIntakeRecap !== undefined
    && failureRecovery.submittedIntakeRecap.fields.length + failureRecovery.submittedIntakeRecap.attachedFiles.length > 0
  ) {
    return {
      label: "Review submitted intake",
      href: buildReviewWorkspaceOverviewHref(input.runId),
    };
  }

  return null;
}

function buildPostFinalizeQuickLinks(
  input: ResolveReviewPackageDoThisNextInput,
): readonly ReviewPackageDoThisNextQuickLink[] {
  const manifestId = input.manifestId?.trim() ?? "";

  if (manifestId.length === 0 || input.blockingFindingCount > 0) {
    return [];
  }

  const runId = input.runId.trim();
  const compareWithPriorHref = input.compareWithPriorHref?.trim() ?? "";
  const compareHref =
    compareWithPriorHref.length > 0 ? compareWithPriorHref : buildCompareTwoReviewsHref({ baseRunId: runId });

  return [
    { label: INVITE_REVIEWER_PAGE_TITLE, href: buildInviteReviewerHref(runId) },
    { label: "Compare reviews", href: compareHref },
    {
      label: `Open ${SPONSOR_BRIEFING_EXPORT_LABEL.toLowerCase()}`,
      href: `${SPONSOR_REPORT_PATH}?runId=${encodeURIComponent(runId)}`,
    },
  ];
}

function attachPostFinalizeGuidance(
  next: ReviewPackageDoThisNext,
  input: ResolveReviewPackageDoThisNextInput,
): ReviewPackageDoThisNext {
  const manifestId = input.manifestId?.trim() ?? "";

  if (manifestId.length === 0 || input.blockingFindingCount > 0) {
    return next;
  }

  const quickLinks = buildPostFinalizeQuickLinks(input);
  const followUpAction = {
    label: "Start follow-up review",
    href: secondReviewFromPriorHref(input.runId),
  };

  if (
    next.kind === "send-to-sponsor"
    && (next.secondaryAction === null || next.secondaryAction === undefined)
  ) {
    return {
      ...next,
      secondaryAction: followUpAction,
      quickLinks,
    };
  }

  if (next.kind === "send-to-sponsor" && next.secondaryAction !== null && next.secondaryAction !== undefined) {
    return {
      ...next,
      quickLinks: [
        followUpAction,
        ...quickLinks,
      ],
    };
  }

  if (next.kind === "open-governance-decision" || next.kind === "compare-to-prior") {
    return {
      ...next,
      quickLinks: [followUpAction, ...quickLinks],
    };
  }

  return next;
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
  const pipelineTerminalFailure = isReviewPipelineTerminalFailure({
    legacyRunStatus: input.legacyRunStatus,
    isDeadLettered: input.isDeadLettered,
  });

  if (input.showProgressTracker && input.manifestId === null && pipelineTerminalFailure) {
    const failureRecovery = resolveReviewFailureRecoveryGuidance({
      runId: input.runId,
      diagnosticContext: input.pipelineDiagnosticContext ?? {
        legacyRunStatus: input.legacyRunStatus,
        isDeadLettered: input.isDeadLettered,
      },
      lastFailureSummary: input.lastFailureSummary ?? null,
      summary: input.pipelineSummary ?? null,
      intakeDescription: input.intakeDescription ?? input.pipelineSummary?.description ?? null,
      intakeSystemName: input.intakeSystemName ?? input.pipelineSummary?.displayName ?? null,
      canConfigureWorkspaceAi: input.canConfigureWorkspaceAi === true,
      realModeFellBackToSimulator: input.realModeFellBackToSimulator === true,
      usesCustomerAiConnection: input.usesCustomerAiConnection === true,
      effectiveSessionMode: input.effectiveSessionMode ?? null,
    });

    const secondaryAction =
      failureRecovery !== null
        ? resolveFailureRecoverySecondaryAction(input, failureRecovery)
        : null;

    return {
      kind: "rerun-review",
      sentence:
        failureRecovery !== null
          ? resolveReviewFailureDoThisNextSentence(failureRecovery, {
              hasRecoverySteps: (failureRecovery.recoverySteps?.length ?? 0) > 0,
            })
          : "Execution failed — re-run the review with the same intake.",
      actionLabel: "Re-run review",
      href: resolveRerunHref(input),
      secondaryAction,
      failureRecovery,
    };
  }

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
    return attachPostFinalizeGuidance(registryNext, input);
  }

  if (primaryAction.kind === "send-to-sponsor" && evidenceCoverageGap(input)) {
    return attachPostFinalizeGuidance(
      {
        kind: primaryAction.kind,
        sentence: evidenceCoverageGapSentence(input.evidenceCoverageTotalCount),
        actionLabel: "Review evidence coverage",
        href: buildReviewWorkspaceTabHref(input.runId, "evidence"),
        buttonVariant: "outline",
        secondaryAction: {
          label: primaryAction.label,
          href: primaryAction.href ?? buildReviewWorkspaceTabHref(input.runId, "review-package", { hash: "sponsor-handoff" }),
        },
      },
      input,
    );
  }

  return attachPostFinalizeGuidance(
    {
      kind: primaryAction.kind,
      sentence: sentenceForPrimaryAction(primaryAction, input),
      actionLabel: primaryAction.label,
      href: primaryAction.href,
    },
    input,
  );
}
