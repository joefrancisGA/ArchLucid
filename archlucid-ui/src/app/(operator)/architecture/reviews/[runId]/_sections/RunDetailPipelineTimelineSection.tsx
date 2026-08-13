import { cn } from "@/lib/utils";
import Link from "next/link";
import type { ReactElement } from "react";

import { AuthorityPipelineTimeline } from "@/components/AuthorityPipelineTimeline";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { OperatorSectionRetryButton } from "@/components/operator/OperatorSectionRetryButton";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { BUYER_SURFACE_VOCABULARY } from "@/lib/vocabulary/buyer-surface-vocabulary";
import { auditTrailNavHref } from "@/lib/audit-nav-paths";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
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
          className={OPERATOR_LINK.nav}
          href={auditTrailNavHref(runId)}
        >
          {BUYER_SURFACE_VOCABULARY.auditTrail}
        </Link>
        .
      </>
    );
  }

  return <>Audit events for this review, oldest first. When all steps complete, the review is ready to finalize.</>;
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
        <p className={cn("m-0 mt-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          For the full {BUYER_SURFACE_VOCABULARY.auditTrail.toLowerCase()} with every recorded milestone, open{" "}
          <Link
            className={OPERATOR_LINK.nav}
            href={auditTrailNavHref(runId)}
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
        <CollapsibleSection
          title="Recent lifecycle events"
          summaryId="pipeline-timeline-title"
          defaultOpen={false}
          sectionTestId="run-pipeline-timeline-collapsible"
        >
          <p className={cn("m-0 mb-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
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
          <h3 id="pipeline-timeline-title" className={runDetailSectionHeadingClass}>
            Pipeline timeline
          </h3>
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
