"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import Link from "next/link";
import type { ReactElement } from "react";

import { InlineGuidance } from "@/components/InlineGuidance";
import { InAppHelpLink } from "@/components/InAppHelpLink";
import { OperatorHomeDisclosureSection } from "@/components/operator-home/OperatorHomeDisclosureSection";
import { OperatorHomeGuidanceLink } from "@/components/operator-home/OperatorHomeGuidanceLink";
import { CorePilotFirstReviewCheckpointStrip } from "@/components/CorePilotFirstReviewCheckpointStrip";
import {
  corePilotStepBadgeLabel,
  type CorePilotCommitProgressState,
} from "@/lib/core-pilot-commit-progress";
import { SPONSOR_DASHBOARD_HREF } from "@/lib/sponsor-dashboard-route";
import { FIRST_ARCHITECTURE_REVIEW_PAGE_TITLE } from "@/lib/first-architecture-review-help-copy";
import { GOVERNANCE_WORKSPACE_HEALTH_HREF } from "@/lib/governance/governance-route-paths";
import { OPERATOR_HOME_DISCLOSURE_STORAGE_KEYS } from "@/lib/operator/operator-home-disclosure-storage";
import { OPERATOR_START_REVIEW_QUICK_ACTION_LABEL } from "@/lib/operator/operator-nav-labels";
import { TENANT_SYSTEM_WORKSPACE_HEALTH_WORKSPACE_LINK } from "@/lib/vocabulary/tenant-system-workspace-health-vocabulary";

export const NEXT_STEPS_LEGACY_MINIMIZED_STORAGE_KEY = "archlucid_core_pilot_next_steps_minimized_v1";

/** Step badge shown in the panel header. */
export function StepBadge({ label }: { label: string }): ReactElement {
  return (
    <span
      className={cn("inline-block rounded-full bg-neutral-100 px-2 py-0.5 font-semibold text-al-text-primary dark:bg-neutral-900/50 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}
      data-testid="pilot-step-badge"
    >
      {label}
    </span>
  );
}

/** Review ID callout for support correlation (API field remains runId). */
export function RunIdNote({ runId }: { runId: string }): ReactElement {
  return (
    <p
      className={cn("m-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
      data-testid="pilot-run-id"
    >
      Review ID:{" "}
      <code className="font-mono">{runId}</code>
    </p>
  );
}

/**
 * "Skip for now" callout — explicitly names advanced features so first-time operators
 * are not distracted by Operate surfaces (alerts, planning, digests, advisory, Compare, Replay, Governance, Ask).
 */
export function SkipForNowNote(): ReactElement {
  return (
    <p
      className={cn("m-0 mt-3 leading-relaxed text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
      data-testid="pilot-skip-for-now"
    >
      <InlineGuidance label="Skip for now:" labelTestId="inline-guidance-skip-for-now">
        Alerts, Planning, Digests, Advisory, Compare, Replay, Governance, and Ask — not needed for your first architecture
        review.
      </InlineGuidance>
    </p>
  );
}

/** Rescue link shown at the bottom of every pre-commit state. */
export function RescueLink(): ReactElement {
  return (
    <p className={cn("m-0 mt-2 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)} data-testid="pilot-rescue-link">
      Blocked?{" "}
      <Link href="/help" className={OPERATOR_LINK.nav}>
        Help
      </Link>
      {" "}or use the{" "}
      <InAppHelpLink helpSlug="first-architecture-review" label={FIRST_ARCHITECTURE_REVIEW_PAGE_TITLE} variant="text" />
    </p>
  );
}

export type CorePilotNextStepsCardStateProps = {
  readonly pilotState: CorePilotCommitProgressState;
  readonly latestRunId: string | null;
  readonly firstCommittedRunId: string | null;
  readonly latestRunReadyToFinalize: boolean;
};

export function CorePilotNextStepsCommittedState(props: CorePilotNextStepsCardStateProps): ReactElement {
  const reviewHref =
    props.firstCommittedRunId !== null ? `/architecture/reviews/${props.firstCommittedRunId}` : "/architecture/reviews";

  return (
    <OperatorHomeDisclosureSection
      title="Review workflow complete"
      titleId="core-pilot-next-steps-complete"
      sectionTestId="core-pilot-next-steps-complete"
      storageKey={OPERATOR_HOME_DISCLOSURE_STORAGE_KEYS.recommendedFirstSessionPath}
      legacyStorageKeys={[NEXT_STEPS_LEGACY_MINIMIZED_STORAGE_KEY]}
      defaultExpanded={true}
      collapsedSummary="First review finalized — open detail, CLI shortcuts, and optional Operate links."
      headerAside={<StepBadge label={corePilotStepBadgeLabel("committed")} />}
    >
      <CorePilotFirstReviewCheckpointStrip
        pilotState={props.pilotState}
        latestRunId={props.latestRunId}
        firstCommittedRunId={props.firstCommittedRunId}
        latestRunReadyToFinalize={props.latestRunReadyToFinalize}
      />
      <p className={cn("mb-3 mt-0 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
        First review is finalized. Open the architecture review and findings — share export-ready
        Markdown/PDF from review detail when needed; CLI shortcuts below speed support tickets.
      </p>

      <div className="mb-3">
        <Link
          href={reviewHref}
          className={OPERATOR_LINK.nav}
        >
          Open architecture review detail
        </Link>
      </div>

      <div className={cn("mb-3 rounded-md border border-neutral-200 bg-neutral-50 p-3 leading-relaxed text-neutral-700 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}>
        <p className="m-0 font-semibold text-neutral-800 dark:text-neutral-100">Copy/paste CLI (replace RUN)</p>
        <code className="mt-1 block whitespace-pre-wrap break-all font-mono">
          archlucid first-value-report RUN --save{"\n"}
          archlucid run-support-packet RUN
        </code>
        <p className={cn("mb-0 mt-2 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          <code className="font-mono">run-support-packet</code> prints review-record/version/trace/context for escalation.
          Workspace Admins can open CLI usage from the Help drawer Advanced diagnostics section.
        </p>
      </div>

      {props.firstCommittedRunId !== null ? (
        <RunIdNote runId={props.firstCommittedRunId} />
      ) : null}

      <div className={cn("mt-3 flex flex-col gap-2 border-t border-neutral-100 pt-3 dark:border-neutral-800", OPERATOR_TYPOGRAPHY.body)}>
        <p className={cn("m-0 font-medium text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          Now available (optional):
        </p>
        <Link
          href={GOVERNANCE_WORKSPACE_HEALTH_HREF}
          className="text-neutral-600 underline decoration-neutral-400 underline-offset-2 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200"
        >
          {TENANT_SYSTEM_WORKSPACE_HEALTH_WORKSPACE_LINK.label}
        </Link>
        <Link href="/insights/ask-review-questions" className={OPERATOR_LINK.nav}>
          Open Ask (Operate)
        </Link>
      </div>
    </OperatorHomeDisclosureSection>
  );
}

export function CorePilotNextStepsHasRunState(props: CorePilotNextStepsCardStateProps): ReactElement {
  return (
    <OperatorHomeDisclosureSection
      title="Recommended first session path"
      titleId="core-pilot-next-steps"
      sectionTestId="core-pilot-next-steps"
      storageKey={OPERATOR_HOME_DISCLOSURE_STORAGE_KEYS.recommendedFirstSessionPath}
      legacyStorageKeys={[NEXT_STEPS_LEGACY_MINIMIZED_STORAGE_KEY]}
      defaultExpanded={false}
      collapsedSummary={`${corePilotStepBadgeLabel("has-run")} — evidence and finalize steps for your in-progress review.`}
      headerAside={<StepBadge label={corePilotStepBadgeLabel("has-run")} />}
    >
      <CorePilotFirstReviewCheckpointStrip
        pilotState={props.pilotState}
        latestRunId={props.latestRunId}
        firstCommittedRunId={props.firstCommittedRunId}
        latestRunReadyToFinalize={props.latestRunReadyToFinalize}
      />
      <OperatorHomeGuidanceLink
        helpSlug="first-architecture-review"
        label={FIRST_ARCHITECTURE_REVIEW_PAGE_TITLE}
        className="mb-2 inline-block"
      />

      {props.latestRunId !== null ? <RunIdNote runId={props.latestRunId} /> : null}

      <ol className={cn("m-0 mt-3 list-none space-y-2 p-0 text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.body)}>
        <li className="flex items-start gap-2 text-neutral-400 dark:text-neutral-500" aria-label="Step 1 complete">
          <span aria-hidden className={cn("mt-0.5 shrink-0 font-bold text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>✓</span>
          <span className="line-through">{OPERATOR_START_REVIEW_QUICK_ACTION_LABEL}</span>
        </li>
        <li className="flex items-start gap-2" aria-label="Step 2 active">
          <span aria-hidden className={cn("mt-0.5 shrink-0 font-bold text-al-text-secondary dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}>▶</span>
          <Link
            href={props.latestRunId !== null ? `/insights/evidence-graph?runId=${encodeURIComponent(props.latestRunId)}` : "/insights/evidence-graph"}
            className={OPERATOR_LINK.nav}
            data-testid="pilot-active-evidence-link"
          >
            Evidence — open evidence trail
          </Link>
        </li>
        <li className="flex items-start gap-2" aria-label="Step 3 active">
          <span aria-hidden className={cn("mt-0.5 shrink-0 font-bold text-al-text-secondary dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}>▶</span>
          <Link
            href={props.latestRunId !== null ? `/architecture/reviews/${props.latestRunId}` : "/architecture/reviews"}
            className={OPERATOR_LINK.nav}
            data-testid="pilot-active-step-link"
          >
            Review — complete the assessment and finalize the review
          </Link>
        </li>
        <li className="flex items-start gap-2 text-neutral-500 dark:text-neutral-400" aria-label="Step 4 pending">
          <span aria-hidden className={cn("mt-0.5 shrink-0 text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>4.</span>
          <span>
            Report — sponsor-facing summary on{" "}
            <Link href={SPONSOR_DASHBOARD_HREF} className={OPERATOR_LINK.nav}>
              Report
            </Link>{" "}
            after outputs land.
          </span>
        </li>
      </ol>

      <SkipForNowNote />
      <RescueLink />
    </OperatorHomeDisclosureSection>
  );
}

export function CorePilotNextStepsNoRunState(props: CorePilotNextStepsCardStateProps): ReactElement {
  return (
    <OperatorHomeDisclosureSection
      title="Recommended first session path"
      titleId="core-pilot-next-steps"
      sectionTestId="core-pilot-next-steps"
      storageKey={OPERATOR_HOME_DISCLOSURE_STORAGE_KEYS.recommendedFirstSessionPath}
      legacyStorageKeys={[NEXT_STEPS_LEGACY_MINIMIZED_STORAGE_KEY]}
      defaultExpanded={false}
      collapsedSummary={`${corePilotStepBadgeLabel("no-run")} — start your first review and follow the four-step path.`}
      headerAside={<StepBadge label={corePilotStepBadgeLabel("no-run")} />}
    >
      <CorePilotFirstReviewCheckpointStrip
        pilotState={props.pilotState}
        latestRunId={props.latestRunId}
        firstCommittedRunId={props.firstCommittedRunId}
        latestRunReadyToFinalize={props.latestRunReadyToFinalize}
      />
      <OperatorHomeGuidanceLink
        helpSlug="first-architecture-review"
        label={FIRST_ARCHITECTURE_REVIEW_PAGE_TITLE}
        className="mb-2 inline-block"
      />

      <ol className={cn("m-0 mt-0 list-none space-y-2 p-0 text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.body)}>
        <li className="flex items-start gap-2" aria-label="Step 1 active">
          <span aria-hidden className={cn("mt-0.5 shrink-0 font-bold text-al-text-secondary dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}>▶</span>
          <Link
            href="/architecture/reviews/new"
            className={OPERATOR_LINK.nav}
            data-testid="pilot-active-step-link"
          >
            {OPERATOR_START_REVIEW_QUICK_ACTION_LABEL}
          </Link>
        </li>
        <li className="flex items-start gap-2 text-neutral-500 dark:text-neutral-400" aria-label="Step 2 pending">
          <span aria-hidden className={cn("mt-0.5 shrink-0 text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>2.</span>
          <span>Evidence — open the evidence trail after your review starts.</span>
        </li>
        <li className="flex items-start gap-2 text-neutral-500 dark:text-neutral-400" aria-label="Step 3 pending">
          <span aria-hidden className={cn("mt-0.5 shrink-0 text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>3.</span>
          <span>Review — complete the assessment and finalize the review from review detail.</span>
        </li>
        <li className="flex items-start gap-2 text-neutral-500 dark:text-neutral-400" aria-label="Step 4 pending">
          <span aria-hidden className={cn("mt-0.5 shrink-0 text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>4.</span>
          <span>Report — sponsor report and sponsor-facing outputs when ready.</span>
        </li>
      </ol>

      <SkipForNowNote />
      <RescueLink />
    </OperatorHomeDisclosureSection>
  );
}
