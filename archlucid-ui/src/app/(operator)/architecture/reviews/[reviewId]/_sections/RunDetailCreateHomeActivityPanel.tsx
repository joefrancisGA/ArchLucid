import type { ReactElement, ReactNode } from "react";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { buildArchitectureWorkspaceTabHref } from "@/lib/architecture/architecture-workspace-tabs";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  RUN_DETAIL_CREATE_HOME_ACTIVITY_ORIENTATION_LEAD,
  RUN_DETAIL_CREATE_HOME_ACTIVITY_TECHNICAL_DETAIL_SUMMARY,
} from "@/lib/runs/run-detail-create-home-activity-copy";
import type { RunSummary } from "@/types/authority";
import { cn } from "@/lib/utils";

import { RunDetailProgressTrackerDeferred } from "./run-detail-page-view-deferred-chunks";

export type RunDetailCreateHomeActivityPanelProps = {
  readonly runId: string;
  readonly routeRunId: string;
  readonly manifestId: string | null;
  readonly showProgressTracker: boolean;
  readonly statusLine: string;
  readonly provenanceAsOfLabel: string;
  readonly preFinalizeReadyToFinalize: boolean;
  readonly progressForPipelineUi: RunSummary;
  readonly outcomeCards: ReactNode;
  readonly midDeferred: ReactNode;
  readonly sourcesPanel: ReactNode;
};

function RunDetailCreateHomeActivityOrientation(props: { readonly runId: string }): ReactElement {
  const overviewHref = buildArchitectureWorkspaceTabHref(props.runId, "overview");
  const findingsHref = buildArchitectureWorkspaceTabHref(props.runId, "findings");
  const clarificationsHref = buildArchitectureWorkspaceTabHref(props.runId, "clarifications");

  return (
    <div
      className="space-y-3 rounded-md border border-neutral-200 bg-al-surface-raised p-3 dark:border-neutral-800"
      data-testid="architecture-activity-orientation"
    >
      <p className={cn("m-0 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
        {RUN_DETAIL_CREATE_HOME_ACTIVITY_ORIENTATION_LEAD}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="primary" size="sm" asChild>
          <Link href={overviewHref}>Open overview</Link>
        </Button>
        <Button type="button" variant="outline" size="sm" asChild>
          <Link href={findingsHref}>Review findings</Link>
        </Button>
        <Button type="button" variant="outline" size="sm" asChild>
          <Link href={clarificationsHref}>Open clarifications</Link>
        </Button>
      </div>
    </div>
  );
}

/** Create-home Activity archTab — timeline hero with deferred forensics under disclosure (TB-1832, TB-1834). */
export function RunDetailCreateHomeActivityPanel(props: RunDetailCreateHomeActivityPanelProps): ReactElement {
  const showTracker = props.showProgressTracker;
  const hasManifest = props.manifestId !== null;

  return (
    <div className="space-y-4" data-testid="run-detail-create-home-activity">
      <div className="space-y-4" data-testid="architecture-activity-primary-region">
        <h2 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}>
          Assessment progress
        </h2>
        <p
          className={cn(
            "m-0 rounded-md border border-neutral-200 bg-al-surface-raised font-medium leading-snug dark:border-neutral-800 p-3",
            OPERATOR_TYPOGRAPHY.body,
          )}
          role="status"
          data-testid="run-detail-activity-status-headline"
        >
          {props.statusLine}
        </p>

        {!hasManifest && showTracker ? (
          <div id="architecture-assessment-progress" className="scroll-mt-24">
            <RunDetailProgressTrackerDeferred
              runId={props.routeRunId}
              initialSummary={props.progressForPipelineUi}
              preFinalizeReadyToFinalize={props.preFinalizeReadyToFinalize}
              buyerAssessmentCopy
            />
          </div>
        ) : null}

        {!showTracker ? <RunDetailCreateHomeActivityOrientation runId={props.runId} /> : null}

        {showTracker && hasManifest ? (
          <RunDetailProgressTrackerDeferred
            runId={props.routeRunId}
            initialSummary={props.progressForPipelineUi}
          />
        ) : null}

        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
          <Link
            className={OPERATOR_LINK.nav}
            href={`/architecture/reviews/${encodeURIComponent(props.runId)}/provenance`}
            data-testid="run-detail-provenance-link"
          >
            Full provenance view
          </Link>
          {props.provenanceAsOfLabel !== "—" ? (
            <span className="text-al-text-secondary"> (as of {props.provenanceAsOfLabel})</span>
          ) : null}
        </p>
      </div>

      <details
        className="rounded-md border border-neutral-200 p-3 dark:border-neutral-800"
        open={false}
        data-testid="architecture-activity-technical-detail"
      >
        <summary className="cursor-pointer font-semibold">
          {RUN_DETAIL_CREATE_HOME_ACTIVITY_TECHNICAL_DETAIL_SUMMARY}
        </summary>
        <div className="mt-3 space-y-4">
          <details className="rounded-md border border-neutral-200 p-3 dark:border-neutral-800" open={false}>
            <summary className="cursor-pointer font-semibold">Outcome metrics and taxonomy</summary>
            <div className="mt-3">{props.outcomeCards}</div>
          </details>
          {props.midDeferred}
          {props.sourcesPanel}
        </div>
      </details>
    </div>
  );
}
