"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { CommitRunButton } from "@/components/CommitRunButton";
import { CopyIdButton } from "@/components/CopyIdButton";
import { ReRunReviewButton } from "@/components/runs/ReRunReviewButton";
import {
  OperatorErrorCallout,
  OperatorWarningCallout,
} from "@/components/operator/OperatorShellMessage";
import { WorkspaceAiAvailabilityPanel } from "@/components/reviews/WorkspaceAiAvailabilityPanel";
import { Button } from "@/components/ui/button";
import type { SessionAiReadinessState } from "@/hooks/use-session-ai-readiness";
import type { ReviewSubmittedIntakeRecap } from "@/lib/derive-review-submitted-intake-recap";
import { DESIGN_TOKENS, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { resolveProbeAwareRecoverySteps } from "@/lib/resolve-probe-aware-recovery-steps";
import {
  resolveProbeAwareReviewFailureDoThisNextSentence,
  resolveProbeSucceededDoThisNextSentence,
  resolveReviewFailureWhatFailedLine,
  shouldShowReviewFailureRecoveryDetail,
} from "@/lib/resolve-review-failure-do-this-next-copy";
import type { RunDetailLastFailureSummary } from "@/components/resolve-run-detail-last-failure-summary";
import {
  formatReviewFailureRecordedAtLabel,
} from "@/components/resolve-run-detail-last-failure-summary";
import { useReviewPipelineReRunInFlight } from "@/hooks/use-review-pipeline-rerun-in-flight";
import { REVIEW_PIPELINE_RE_RUN_IN_PROGRESS_DO_THIS_NEXT_SENTENCE } from "@/lib/operations/review-pipeline-rerun-in-flight";
import { ReviewFailureTechnicalMetadataDisclosure } from "@/components/reviews/ReviewFailureTechnicalMetadataDisclosure";
import { WhyDisabledCtaHint } from "@/components/usability/WhyDisabledCtaHint";
import type { ReviewFailureAdminHandoff } from "@/lib/review-failure-recovery-role-copy";
import type { ReviewPipelineDiagnosticContext } from "@/lib/review-pipeline-stall-diagnosis";
import { runCollateralSealedManifestCopyBlockedReason } from "@/lib/runs/run-collateral-sealed-manifest-guard";
import type { RunSummary } from "@/types/authority";
import { cn } from "@/lib/utils";

import type { TransparencyTrail } from "@/types/feasibility-verdict";

import type { ReviewPackageDoThisNext } from "./resolve-review-package-do-this-next";

function resolveFailureRecoverySteps(
  failureRecovery: NonNullable<ReviewPackageDoThisNext["failureRecovery"]>,
  sessionAiReadiness: SessionAiReadinessState,
  usesCustomerAiConnection: boolean,
  canConfigureWorkspaceAi: boolean,
): readonly string[] {
  const workspaceAiSignal = failureRecovery.workspaceAiConfigurationSignal;

  if (workspaceAiSignal !== null && workspaceAiSignal !== undefined) {
    return resolveProbeAwareRecoverySteps({
      baseSteps: failureRecovery.recoverySteps,
      probeState: sessionAiReadiness.probeState,
      usesCustomerAiConnection,
      canConfigureWorkspaceAi,
      reviewTerminalFailure: true,
    });
  }

  return failureRecovery.recoverySteps;
}

function isLiveAiProbeAvailable(sessionAiReadiness: SessionAiReadinessState): boolean {
  return (
    sessionAiReadiness.probeState.status === "loaded"
    && sessionAiReadiness.probeState.result.isAvailable
  );
}

function isPreStageAiAvailabilityReassurance(
  failureRecovery: NonNullable<ReviewPackageDoThisNext["failureRecovery"]>,
): boolean {
  return (failureRecovery.intactSummary ?? "").includes("platform AI availability");
}

function resolveDisplayedDoThisNextSentence(
  next: ReviewPackageDoThisNext,
  sessionAiReadiness: SessionAiReadinessState,
  hasRecoverySteps: boolean,
): string {
  const failureRecovery = next.failureRecovery;

  if (
    failureRecovery === null
    || failureRecovery === undefined
    || failureRecovery.workspaceAiConfigurationSignal === null
    || failureRecovery.workspaceAiConfigurationSignal === undefined
  ) {
    return next.sentence;
  }

  if (isLiveAiProbeAvailable(sessionAiReadiness)) {
    return resolveProbeSucceededDoThisNextSentence(failureRecovery);
  }

  if (isPreStageAiAvailabilityReassurance(failureRecovery)) {
    return resolveProbeAwareReviewFailureDoThisNextSentence(
      failureRecovery,
      sessionAiReadiness.probeState,
      { hasRecoverySteps },
    );
  }

  return next.sentence;
}

export type ReviewPackageDoThisNextStripProps = {
  readonly next: ReviewPackageDoThisNext;
  readonly runId: string;
  readonly retryCount?: number | null;
  readonly hasGoldenManifest: boolean;
  readonly commitBlockedReason: string | null | undefined;
  readonly sessionAiReadiness: SessionAiReadinessState;
  readonly canConfigureWorkspaceAi?: boolean;
  readonly usesCustomerAiConnection?: boolean;
  readonly transparencyTrail?: TransparencyTrail | null;
  readonly lastFailureSummary?: RunDetailLastFailureSummary | null;
  readonly failureRecordedAtUtc?: string | null;
  readonly pipelineDiagnosticContext?: ReviewPipelineDiagnosticContext | null;
  readonly pipelineSummary?: RunSummary | null;
};

function ReviewFailureAdminHandoffPanel(props: {
  readonly runId: string;
  readonly manifestVersion: string | null;
  readonly adminHandoff: ReviewFailureAdminHandoff;
}): React.JSX.Element {
  const { adminHandoff, runId, manifestVersion } = props;
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const [blockedReason, setBlockedReason] = useState<string | null>(null);

  useEffect(() => {
    if (copyState !== "copied") {
      return;
    }

    const timer = window.setTimeout(() => {
      setCopyState("idle");
    }, 2500);

    return () => {
      window.clearTimeout(timer);
    };
  }, [copyState]);

  async function onCopyHandoff(): Promise<void> {
    const blocked = runCollateralSealedManifestCopyBlockedReason({ runId, manifestVersion });

    if (blocked !== null) {
      setBlockedReason(blocked);
      setCopyState("failed");
      return;
    }

    setBlockedReason(null);

    try {
      await navigator.clipboard.writeText(adminHandoff.markdown);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
      setBlockedReason("Clipboard unavailable — select the text above and copy manually.");
    }
  }

  return (
    <div
      className="rounded-md border border-neutral-200 bg-al-surface-raised p-3 dark:border-neutral-800"
      data-testid="review-package-admin-handoff"
    >
      <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
        Share with your workspace administrator
      </p>
      <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        Copy this summary for the person who can configure workspace AI settings. Your intake package is already recorded.
      </p>

      <ul className={cn("m-0 mt-3 list-disc space-y-1 pl-5 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
        {adminHandoff.verificationLines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>

      <pre
        className={cn(
          "m-0 mt-3 max-h-48 overflow-auto rounded-md border border-neutral-200 bg-neutral-50 p-3 whitespace-pre-wrap text-neutral-800 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100",
          OPERATOR_TYPOGRAPHY.helper,
        )}
        data-testid="review-package-admin-handoff-markdown"
      >
        {adminHandoff.markdown}
      </pre>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => void onCopyHandoff()}>
          {copyState === "copied" ? "Copied handoff" : "Copy administrator handoff"}
        </Button>
        {copyState === "failed" ? (
          <span className={cn("text-rose-700 dark:text-rose-300", OPERATOR_TYPOGRAPHY.helper)} role="alert">
            {blockedReason ?? "Clipboard unavailable — select the text above and copy manually."}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function ReviewSubmittedIntakeRecapPanel(props: {
  readonly recap: ReviewSubmittedIntakeRecap;
}): React.JSX.Element {
  const { recap } = props;

  return (
    <div
      className="rounded-md border border-neutral-200 bg-al-surface-raised p-3 dark:border-neutral-800"
      data-testid="review-package-submitted-intake-recap"
    >
      <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
        Review scope
      </p>
      <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        Read-only — this is what was recorded when the review started. Re-run review reuses this package unchanged.
      </p>

      {recap.fields.length > 0 ? (
        <dl className={cn("m-0 mt-3 grid gap-3", OPERATOR_TYPOGRAPHY.body)}>
          {recap.fields.map((field) => (
            <div key={`${field.label}:${field.value}`} className="min-w-0">
              <dt className="font-medium text-neutral-500 dark:text-neutral-400">{field.label}</dt>
              <dd className="m-0 mt-1 whitespace-pre-wrap break-words text-neutral-800 dark:text-neutral-200">
                {field.value}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}

      {recap.attachedFiles.length > 0 ? (
        <div className="mt-3">
          <p className={cn("m-0 font-medium text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
            Attached files
          </p>
          <ul className={cn("m-0 mt-1 list-disc space-y-1 pl-5 text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.body)}>
            {recap.attachedFiles.map((fileName) => (
              <li key={fileName}>{fileName}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function ReviewFailureRecoveryDetails(props: {
  readonly runId: string;
  readonly manifestVersion: string | null;
  readonly failureRecovery: NonNullable<ReviewPackageDoThisNext["failureRecovery"]>;
  readonly sessionAiReadiness: SessionAiReadinessState;
  readonly canConfigureWorkspaceAi: boolean;
  readonly usesCustomerAiConnection: boolean;
  readonly lastFailureSummary?: RunDetailLastFailureSummary | null;
  readonly failureRecordedAtUtc?: string | null;
  readonly pipelineDiagnosticContext?: ReviewPipelineDiagnosticContext | null;
  readonly pipelineSummary?: RunSummary | null;
  readonly retryCount?: number | null;
  readonly footActionRow: React.ReactNode;
  readonly showRecoverySteps: boolean;
}): React.JSX.Element {
  const {
    runId,
    manifestVersion,
    failureRecovery,
    sessionAiReadiness,
    canConfigureWorkspaceAi,
    usesCustomerAiConnection,
    lastFailureSummary,
    failureRecordedAtUtc,
    pipelineDiagnosticContext,
    pipelineSummary,
    retryCount,
    footActionRow,
    showRecoverySteps,
  } = props;
  const Callout =
    failureRecovery.severity === "warning" ? OperatorWarningCallout : OperatorErrorCallout;
  const intactSummary = failureRecovery.intactSummary?.trim() ?? "";
  const showDetail = shouldShowReviewFailureRecoveryDetail(failureRecovery);
  const recoverySteps = resolveFailureRecoverySteps(
    failureRecovery,
    sessionAiReadiness,
    usesCustomerAiConnection,
    canConfigureWorkspaceAi,
  );

  return (
    <div className="space-y-3" data-testid="review-package-failure-recovery">
      <div data-testid="review-package-failure-review-id">
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          <span className="font-semibold text-al-text-primary">Review ID:</span>{" "}
          <span className="inline-flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <code className={cn("break-all font-mono select-all", OPERATOR_TYPOGRAPHY.micro)}>{runId}</code>
            <CopyIdButton value={runId} aria-label="Copy review ID" />
          </span>
        </p>
        <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          <Link href={failureRecovery.supportHref} className="text-al-link underline-offset-2 hover:underline">
            Report a problem
          </Link>{" "}
          and include this review ID if you need support.
        </p>
      </div>

      <ReviewFailureTechnicalMetadataDisclosure
        runId={runId}
        lastFailureSummary={lastFailureSummary ?? null}
        diagnosticContext={pipelineDiagnosticContext ?? null}
        pipelineSummary={pipelineSummary ?? null}
        failureRecordedAtUtc={failureRecordedAtUtc ?? null}
        retryCount={retryCount ?? null}
      />

      {showDetail ? (
        <Callout>
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)} data-testid="review-package-failure-detail">
            {failureRecovery.detail}
          </p>
        </Callout>
      ) : null}

      {intactSummary.length > 0 && showDetail ? (
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} data-testid="review-package-failure-intact">
          <span className="font-semibold text-al-text-primary">What&apos;s intact:</span> {intactSummary}
        </p>
      ) : null}

      {showRecoverySteps && recoverySteps.length > 0 ? (
        <div data-testid="review-package-failure-recovery-steps">
          <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
            What to do
          </p>
          <ol className={cn("m-0 mt-2 list-decimal space-y-1 pl-5 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
            {recoverySteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
      ) : null}

      {failureRecovery.adminHandoff !== null && failureRecovery.adminHandoff !== undefined ? (
        <ReviewFailureAdminHandoffPanel
          runId={runId}
          manifestVersion={manifestVersion}
          adminHandoff={failureRecovery.adminHandoff}
        />
      ) : null}

      {failureRecovery.adminConfigurationHref !== null &&
      failureRecovery.adminConfigurationHref !== undefined &&
      failureRecovery.adminConfigurationLabel !== null &&
      failureRecovery.adminConfigurationLabel !== undefined ? (
        <div data-testid="review-package-admin-configuration-link">
          <Link href={failureRecovery.adminConfigurationHref} className={cn(OPERATOR_LINK, OPERATOR_TYPOGRAPHY.body)}>
            {failureRecovery.adminConfigurationLabel}
          </Link>
        </div>
      ) : null}

      {failureRecovery.suggestSupportTicket ? (
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} data-testid="review-package-failure-support-hint">
          If these steps do not resolve the failure,{" "}
          <Link href={failureRecovery.supportHref} className="text-al-link underline-offset-2 hover:underline">
            open a support ticket via Report a problem
          </Link>{" "}
          and include this review id.
        </p>
      ) : null}

      <div
        className="flex min-w-0 w-full max-w-full flex-col items-start gap-2"
        data-testid="review-package-failure-foot-action"
      >
        {footActionRow}
      </div>
    </div>
  );
}

/** TB-2175: above-fold one-sentence next step with a single primary CTA for review package detail. */
export function ReviewPackageDoThisNextStrip(
  props: ReviewPackageDoThisNextStripProps,
): React.JSX.Element {
  const {
    next,
    runId,
    retryCount = null,
    hasGoldenManifest,
    commitBlockedReason,
    sessionAiReadiness,
    canConfigureWorkspaceAi = false,
    usesCustomerAiConnection = false,
    lastFailureSummary = null,
    failureRecordedAtUtc = null,
    pipelineDiagnosticContext = null,
    pipelineSummary = null,
  } = props;
  const buttonVariant = next.buttonVariant ?? "primary";
  const blockRerun = next.kind === "rerun-review" && sessionAiReadiness.blocksExecute;
  const reRunInFlight = useReviewPipelineReRunInFlight(runId);
  const suppressStaleFailureRecovery =
    reRunInFlight && next.failureRecovery !== null && next.failureRecovery !== undefined;
  const failureRecordedAtLabel = formatReviewFailureRecordedAtLabel(failureRecordedAtUtc);
  const disabledRerunHintId = "review-package-rerun-disabled-hint";

  const primaryActionButton =
    next.kind === "finalize-package" ? (
      <CommitRunButton
        runId={runId}
        disabled={hasGoldenManifest}
        commitBlockedReason={commitBlockedReason}
        buttonVariant="primary"
      />
    ) : next.kind === "rerun-review" && !blockRerun ? (
      <ReRunReviewButton
        runId={runId}
        retryCount={retryCount}
        variant={buttonVariant}
        size="sm"
        data-testid="review-package-re-run-review"
      />
    ) : next.href !== null && !blockRerun ? (
      <Button type="button" variant={buttonVariant} size="sm" asChild>
        <Link href={next.href}>{next.actionLabel}</Link>
      </Button>
    ) : (
      <Button
        type="button"
        variant={buttonVariant}
        size="sm"
        disabled
        aria-describedby={blockRerun ? disabledRerunHintId : undefined}
        data-testid="review-package-do-this-next-disabled-action"
      >
        {next.actionLabel}
      </Button>
    );

  const primaryAction = (
    <>
      {primaryActionButton}
      {blockRerun ? (
        <WhyDisabledCtaHint
          id={disabledRerunHintId}
          reason={{
            kind: "prerequisite",
            message: sessionAiReadiness.detail ?? "Live AI is not ready for Real mode.",
          }}
          testId="review-package-rerun-disabled-hint"
        />
      ) : null}
    </>
  );

  const actionRow = (
    <>
      {primaryAction}
      {next.secondaryAction !== null && next.secondaryAction !== undefined ? (
        <Button type="button" variant="outline" size="sm" asChild>
          <Link href={next.secondaryAction.href} data-testid="review-package-do-this-next-secondary-action">
            {next.secondaryAction.label}
          </Link>
        </Button>
      ) : null}
      {next.quickLinks !== null && next.quickLinks !== undefined && next.quickLinks.length > 0 ? (
        <div className="flex flex-wrap gap-2" data-testid="review-package-do-this-next-quick-links">
          {next.quickLinks.map((link) => (
            <Button key={link.href} type="button" variant="outline" size="sm" asChild>
              <Link href={link.href}>{link.label}</Link>
            </Button>
          ))}
        </div>
      ) : null}
    </>
  );

  const hasFailureRecovery = next.failureRecovery !== null && next.failureRecovery !== undefined;
  const failureRecoverySteps =
    hasFailureRecovery
      ? resolveFailureRecoverySteps(
          next.failureRecovery,
          sessionAiReadiness,
          usesCustomerAiConnection,
          canConfigureWorkspaceAi,
        )
      : [];
  const showFailureRecoverySteps = failureRecoverySteps.length > 0;
  const displayedSentence = suppressStaleFailureRecovery
    ? REVIEW_PIPELINE_RE_RUN_IN_PROGRESS_DO_THIS_NEXT_SENTENCE
    : resolveDisplayedDoThisNextSentence(next, sessionAiReadiness, showFailureRecoverySteps);
  const whatFailedLine =
    hasFailureRecovery && !suppressStaleFailureRecovery
      ? resolveReviewFailureWhatFailedLine(
          lastFailureSummary,
          next.failureRecovery,
          pipelineSummary,
        )
      : null;
  const workspaceAiSignal = next.failureRecovery?.workspaceAiConfigurationSignal ?? null;
  const submittedIntakeRecap = next.failureRecovery?.submittedIntakeRecap ?? null;

  const stripCalloutClass =
    hasFailureRecovery && !suppressStaleFailureRecovery
      ? DESIGN_TOKENS.callout.blockedShell
      : DESIGN_TOKENS.callout.info;

  if (hasFailureRecovery && !suppressStaleFailureRecovery) {
    return (
      <div className="space-y-3" data-testid="review-package-do-this-next-strip">
        <section
          className={cn(stripCalloutClass, "flex min-w-0 max-w-full flex-col gap-3 p-4")}
          aria-labelledby="review-package-do-this-next-heading"
        >
          <div className="min-w-0 max-w-full space-y-1">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <h2
                id="review-package-do-this-next-heading"
                className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
              >
                Do this next
              </h2>
              {failureRecordedAtLabel !== null ? (
                <p
                  className={cn("m-0 shrink-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                  data-testid="review-package-failure-recorded-at"
                >
                  Failed {failureRecordedAtLabel}
                </p>
              ) : null}
            </div>
            <p
              className={cn("m-0 break-words text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
              data-testid="review-package-do-this-next-sentence"
            >
              {displayedSentence}
            </p>
          </div>

          {whatFailedLine !== null ? (
            <div data-testid="review-package-failure-cause">
              <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
                <span className="font-semibold text-al-text-primary">What failed:</span> {whatFailedLine}
              </p>
            </div>
          ) : null}

          <div
            className="flex min-w-0 w-full max-w-full flex-col items-start gap-2"
            data-testid="review-package-do-this-next-action"
            data-review-package-do-this-next-kind={next.kind}
          >
            {actionRow}
          </div>
        </section>

        {workspaceAiSignal !== null && workspaceAiSignal !== undefined ? (
          <WorkspaceAiAvailabilityPanel
            workspaceAiSignal={workspaceAiSignal}
            availabilityCheck={{
              state: sessionAiReadiness.probeState,
              checkAvailability: sessionAiReadiness.checkAvailability,
            }}
            reviewTerminalFailure
            scopingLabel="Workspace AI check (this review)"
          />
        ) : null}

        {submittedIntakeRecap !== null && submittedIntakeRecap !== undefined ? (
          <ReviewSubmittedIntakeRecapPanel recap={submittedIntakeRecap} />
        ) : null}

        <ReviewFailureRecoveryDetails
          runId={runId}
          manifestVersion={hasGoldenManifest ? "committed" : null}
          failureRecovery={next.failureRecovery}
          sessionAiReadiness={sessionAiReadiness}
          canConfigureWorkspaceAi={canConfigureWorkspaceAi}
          usesCustomerAiConnection={usesCustomerAiConnection}
          lastFailureSummary={lastFailureSummary}
          failureRecordedAtUtc={failureRecordedAtUtc}
          pipelineDiagnosticContext={pipelineDiagnosticContext}
          pipelineSummary={pipelineSummary}
          retryCount={retryCount}
          footActionRow={primaryActionButton}
          showRecoverySteps={showFailureRecoverySteps}
        />
      </div>
    );
  }

  return (
    <section
      className={cn(stripCalloutClass, "flex min-w-0 max-w-full flex-col gap-3 p-4")}
      data-testid="review-package-do-this-next-strip"
      aria-labelledby="review-package-do-this-next-heading"
    >
      <div className="min-w-0 max-w-full space-y-1">
        <h2
          id="review-package-do-this-next-heading"
          className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
        >
          Do this next
        </h2>
        <p
          className={cn("m-0 break-words text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
          data-testid="review-package-do-this-next-sentence"
        >
          {displayedSentence}
        </p>
      </div>

      <div
        className="flex min-w-0 w-full max-w-full shrink-0 flex-col items-stretch gap-2 sm:items-end"
        data-testid="review-package-do-this-next-action"
        data-review-package-do-this-next-kind={next.kind}
      >
        {actionRow}
      </div>
    </section>
  );
}
