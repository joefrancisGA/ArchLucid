"use client";

import Link from "next/link";

import {
  GovernanceFindingsAssignedToMeCountMismatchBanner,
} from "@/app/(operator)/governance/findings/GovernanceFindingsAssignedToMeChrome";
import { FindingsQueuePickReviewBeforeTriageStrip } from "@/components/governance/findings/FindingsQueuePickReviewBeforeTriageStrip";
import { IntegrationConnectChecklist } from "@/components/integrations/IntegrationConnectChecklist";
import { ArchitecturePosturePillarOverview } from "@/components/governance/posture/ArchitecturePosturePillarOverview";
import { CanonicalObjectSecondaryViewStrip } from "@/components/usability/CanonicalObjectSecondaryViewStrip";
import { Button } from "@/components/ui/button";
import { COMPARE_FINDING_LIFECYCLE_ANCHOR } from "@/lib/compare-finding-lifecycle";
import { comparePageHrefAdaptive } from "@/lib/compare-url-query-params";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  DEFAULT_FINDING_JOB_VIEW,
  FINDING_JOB_VIEW_LABELS,
} from "@/lib/findings/finding-job-view";
import { cn } from "@/lib/utils";

import type { GovernanceFindingsQueueAssignedToMeShellProps } from "@/app/(operator)/governance/findings/GovernanceFindingsQueueAssignedToMeShell";
import { GovernanceFindingsQueueQuietEnginesHint } from "@/app/(operator)/governance/findings/GovernanceFindingsQueueQuietEnginesHint";

export function GovernanceFindingsQueueScopeSection(
  props: GovernanceFindingsQueueAssignedToMeShellProps,
): React.JSX.Element {
  return (
    <>
      {props.secondaryViewPresentation !== null ? (
        <CanonicalObjectSecondaryViewStrip
          presentation={props.secondaryViewPresentation}
          testId="governance-findings-secondary-view-strip"
          className="mb-1"
        />
      ) : null}

      {props.scopedRunId ? (
        <p
          className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
          data-testid="governance-findings-run-scope-banner"
        >
          {"Showing findings for review "}
          <span className="font-mono text-al-text-primary">{props.scopedRunId}</span>
          {" · "}
          <Link className={OPERATOR_LINK.inline} href={props.navHref}>
            Clear review scope
          </Link>
          {" · "}
          <Link className={OPERATOR_LINK.inline} href={`/architecture/reviews/${encodeURIComponent(props.scopedRunId)}`}>
            Open review
          </Link>
          {" · "}
          <Link
            className={OPERATOR_LINK.inline}
            href={
              props.scopedFindingLifecycleCompareHref ??
              `${comparePageHrefAdaptive("", props.scopedRunId)}#${COMPARE_FINDING_LIFECYCLE_ANCHOR}`
            }
          >
            Compare with prior review (finding lifecycle)
          </Link>
        </p>
      ) : !props.isAssignedToMe && (props.scopedRunId === null || props.scopedRunId.length === 0) ? (
        <FindingsQueuePickReviewBeforeTriageStrip
          selectedReviewId=""
          onSelectReview={props.onPickReviewForTriage}
        />
      ) : null}

      {props.scopedRunFilterActive ? (
        <GovernanceFindingsQueueQuietEnginesHint scopedRunId={props.scopedRunId} />
      ) : null}

      {props.scopedRunFilterActive ? (
        <IntegrationConnectChecklist
          title="Triage checklist"
          steps={props.findingsQueueTriageSteps}
          emphasizedStepId={props.findingsQueueTriageEmphasizedStepId ?? ""}
          testIdPrefix="findings-queue-triage"
        />
      ) : null}

      {props.jobViewFilterActive ? (
        <p
          className={cn("m-0 flex flex-wrap items-center gap-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="governance-findings-job-view-filter-chip"
        >
          <span>
            Filtered by job view:{" "}
            <span className="font-medium text-al-text-primary">{FINDING_JOB_VIEW_LABELS[props.jobView]}</span>
          </span>
          <Button type="button" size="sm" variant="outline" onClick={() => props.onSetJobView(DEFAULT_FINDING_JOB_VIEW)}>
            Clear job view filter
          </Button>
        </p>
      ) : null}

      {props.assignedToMeCountMismatch ? (
        <GovernanceFindingsAssignedToMeCountMismatchBanner
          assignedToMeCountData={props.assignedToMeCountData}
          assignedToMeLoadedFindingCount={props.assignedToMeLoadedFindingCount}
        />
      ) : null}

      {!props.isAssignedToMe ? (
        <ArchitecturePosturePillarOverview projectId={props.scopeRecordProjectId} enabled />
      ) : null}
    </>
  );
}
