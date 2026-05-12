import Link from "next/link";
import type { ReactElement } from "react";

import { AuthorityPipelineTimeline } from "@/components/AuthorityPipelineTimeline";
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

export function RunDetailPipelineTimelineSection(
  props: RunDetailPipelineTimelineSectionProps,
): ReactElement {
  const { runId, buyerPolishedArtifactTable, pipelineTimelineFailure, pipelineTimelineForUi } = props;

  return (
    <section id="pipeline-timeline" className="scroll-mt-24" aria-labelledby="pipeline-timeline-title">
      <Card>
        <CardHeader>
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <h3 id="pipeline-timeline-title" className={runDetailSectionHeadingClass}>
              {buyerPolishedArtifactTable ? "Review activity timeline" : "Pipeline timeline"}
            </h3>
            <ContextualHelp helpKey="run-pipeline-status" placement="right" />
          </div>
          <CardDescription>
            {buyerPolishedArtifactTable ? (
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
            ) : (
              "Audit events for this review, oldest first."
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
    </section>
  );
}
