import Link from "next/link";
import type { ReactElement } from "react";

import { AuthorityPipelineTimeline } from "@/components/AuthorityPipelineTimeline";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { ContextualHelp } from "@/components/ContextualHelp";
import { OperatorSectionRetryButton } from "@/components/OperatorSectionRetryButton";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { BUYER_SURFACE_VOCABULARY } from "@/lib/buyer-surface-vocabulary";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import type { PipelineTimelineItem } from "@/types/authority";

import { runDetailSectionHeadingClass } from "./run-detail-section-heading";

type RunDetailPipelineTimelineSectionProps = {
  readonly runId: string;
  readonly buyerPolishedArtifactTable: boolean;
  readonly pipelineTimelineFailure: ApiLoadFailureState | null;
  readonly pipelineTimelineForUi: PipelineTimelineItem[] | null;
};

function pipelineTimelineDescription(runId: string, buyerPolishedArtifactTable: boolean): ReactElement {
  if (buyerPolishedArtifactTable) {
    return (
      <>
        Major milestones only — granular events and timestamps live in the{" "}
        <Link
          className="font-medium text-teal-800 underline underline-offset-2 hover:text-teal-900 dark:text-teal-300 dark:hover:text-teal-200"
          href={`/audit?runId=${encodeURIComponent(runId)}`}
        >
          {BUYER_SURFACE_VOCABULARY.auditTrail}
        </Link>
        .
      </>
    );
  }

  return <>Audit events for this review, oldest first.</>;
}

function pipelineTimelineBody(props: RunDetailPipelineTimelineSectionProps): ReactElement {
  const { runId, buyerPolishedArtifactTable, pipelineTimelineFailure, pipelineTimelineForUi } = props;

  return (
    <>
      {pipelineTimelineFailure ? (
        <>
          <AuthorityPipelineTimeline
            items={null}
            loadErrorMessage={pipelineTimelineFailure.message}
            omitEventTechnicalDetails={buyerPolishedArtifactTable}
          />
          <OperatorSectionRetryButton label="Retry loading timeline" />
        </>
      ) : (
        <AuthorityPipelineTimeline
          items={pipelineTimelineForUi}
          omitEventTechnicalDetails={buyerPolishedArtifactTable}
        />
      )}
      {buyerPolishedArtifactTable &&
      !pipelineTimelineFailure &&
      pipelineTimelineForUi !== null &&
      pipelineTimelineForUi.length > 0 &&
      pipelineTimelineForUi.length < 3 ? (
        <p className="m-0 mt-3 text-sm text-neutral-600 dark:text-neutral-400">
          For the full {BUYER_SURFACE_VOCABULARY.auditTrail.toLowerCase()} with every recorded milestone, open{" "}
          <Link
            className="font-medium text-teal-800 underline underline-offset-2 hover:text-teal-900 dark:text-teal-300 dark:hover:text-teal-200"
            href={`/audit?runId=${encodeURIComponent(runId)}`}
          >
            {BUYER_SURFACE_VOCABULARY.auditTrail}
          </Link>
          .
        </p>
      ) : null}
    </>
  );
}

export function RunDetailPipelineTimelineSection(
  props: RunDetailPipelineTimelineSectionProps,
): ReactElement {
  const { runId, buyerPolishedArtifactTable, pipelineTimelineFailure, pipelineTimelineForUi } = props;

  if (buyerPolishedArtifactTable) {
    return (
      <section id="pipeline-timeline" className="scroll-mt-24" aria-labelledby="pipeline-timeline-title">
        <CollapsibleSection title="Recent lifecycle events" defaultOpen={false} sectionTestId="run-pipeline-timeline-collapsible">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <ContextualHelp helpKey="run-pipeline-status" placement="right" />
          </div>
          <p className="m-0 mb-3 text-sm text-neutral-600 dark:text-neutral-400">
            {pipelineTimelineDescription(runId, buyerPolishedArtifactTable)}
          </p>
          {pipelineTimelineBody(props)}
        </CollapsibleSection>
      </section>
    );
  }

  return (
    <section id="pipeline-timeline" className="scroll-mt-24" aria-labelledby="pipeline-timeline-title">
      <Card>
        <CardHeader>
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <h3 id="pipeline-timeline-title" className={runDetailSectionHeadingClass}>
              Pipeline timeline
            </h3>
            <ContextualHelp helpKey="run-pipeline-status" placement="right" />
          </div>
          <CardDescription>{pipelineTimelineDescription(runId, buyerPolishedArtifactTable)}</CardDescription>
        </CardHeader>
        <CardContent>
          {pipelineTimelineBody({
            runId,
            buyerPolishedArtifactTable,
            pipelineTimelineFailure,
            pipelineTimelineForUi,
          })}
        </CardContent>
      </Card>
    </section>
  );
}
