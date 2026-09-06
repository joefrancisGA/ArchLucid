"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import type { ReactElement } from "react";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { AuthorityPipelineTimeline } from "@/components/AuthorityPipelineTimeline";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { OperatorSectionRetryButton } from "@/components/operator/OperatorSectionRetryButton";
import { BUYER_SURFACE_VOCABULARY } from "@/lib/vocabulary/buyer-surface-vocabulary";
import { auditTrailNavHref } from "@/lib/audit-nav-paths";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { formatInstantForLocale } from "@/lib/locale-datetime";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  parseRunPipelineTimelineOpenFromSearch,
  runPipelineTimelineDisclosureHrefFromSearch,
} from "@/lib/runs/run-pipeline-timeline-disclosure-url";
import type { PipelineTimelineItem } from "@/types/authority";

const OPERATOR_INLINE_AUDIT_EVENT_LIMIT = 5;

type RunDetailPipelineTimelineSectionProps = {
  readonly runId: string;
  readonly buyerPolishedArtifactTable: boolean;
  readonly pipelineTimelineFailure: ApiLoadFailureState | null;
  readonly pipelineTimelineForUi: PipelineTimelineItem[] | null;
};

function auditTrailDescription(runId: string, buyerPolishedArtifactTable: boolean): ReactElement {
  const auditTrailLabel = BUYER_SURFACE_VOCABULARY.auditTrail;

  if (buyerPolishedArtifactTable) {
    return (
      <>
        Major milestones only — granular events and timestamps live in the{" "}
        <Link
          className={OPERATOR_LINK.nav}
          href={auditTrailNavHref(runId)}
        >
          {auditTrailLabel}
        </Link>
        .
      </>
    );
  }

  return (
    <>
      Recorded events for this review, newest first. Open the full{" "}
      <Link className={OPERATOR_LINK.nav} href={auditTrailNavHref(runId)}>
        {auditTrailLabel.toLowerCase()}
      </Link>{" "}
      for every milestone and timestamp.
    </>
  );
}

function buildAuditTrailSummaryLine(items: PipelineTimelineItem[] | null): string | undefined {
  if (items === null || items.length === 0) {
    return undefined;
  }

  const lastEvent = items[items.length - 1]!;
  const lastLabel = formatInstantForLocale(lastEvent.occurredUtc);
  const countLabel = items.length === 1 ? "1 event" : `${items.length} events`;

  return `${countLabel} · last ${lastLabel}`;
}

function pipelineTimelineBody(props: RunDetailPipelineTimelineSectionProps): ReactElement {
  const { runId, buyerPolishedArtifactTable, pipelineTimelineFailure, pipelineTimelineForUi } = props;
  const totalCount = pipelineTimelineForUi?.length ?? 0;
  const showFullTrailLink =
    !buyerPolishedArtifactTable
    && !pipelineTimelineFailure
    && totalCount > OPERATOR_INLINE_AUDIT_EVENT_LIMIT;

  return (
    <>
      {pipelineTimelineFailure ? (
        <>
          <AuthorityPipelineTimeline
            items={null}
            loadErrorMessage={pipelineTimelineFailure.message}
            omitEventTechnicalDetails={buyerPolishedArtifactTable}
          />
          <OperatorSectionRetryButton label="Retry loading audit trail" />
        </>
      ) : (
        <AuthorityPipelineTimeline
          items={pipelineTimelineForUi}
          omitEventTechnicalDetails={buyerPolishedArtifactTable}
          maxVisibleItems={buyerPolishedArtifactTable ? undefined : OPERATOR_INLINE_AUDIT_EVENT_LIMIT}
        />
      )}
      {showFullTrailLink ? (
        <p className={cn("m-0 mt-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          Showing the {OPERATOR_INLINE_AUDIT_EVENT_LIMIT} most recent events. Open the full{" "}
          <Link className={OPERATOR_LINK.nav} href={auditTrailNavHref(runId)}>
            {BUYER_SURFACE_VOCABULARY.auditTrail}
          </Link>{" "}
          for all {totalCount} recorded events.
        </p>
      ) : null}
      {buyerPolishedArtifactTable
      && !pipelineTimelineFailure
      && pipelineTimelineForUi !== null
      && pipelineTimelineForUi.length > 0
      && pipelineTimelineForUi.length < 3 ? (
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
  const { runId, pipelineTimelineFailure, pipelineTimelineForUi } = props;
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const runPipelineTimelineOpenParam = searchParams.get("runPipelineTimelineOpen");
  const [open, setOpenState] = useState(() => parseRunPipelineTimelineOpenFromSearch(runPipelineTimelineOpenParam));
  const auditTrailLabel = BUYER_SURFACE_VOCABULARY.auditTrail;
  const summaryLine = buildAuditTrailSummaryLine(
    pipelineTimelineFailure ? null : pipelineTimelineForUi,
  );

  const syncOpenToUrl = useCallback(
    (detailsOpen: boolean) => {
      router.replace(runPipelineTimelineDisclosureHrefFromSearch(searchParams.toString(), detailsOpen, pathname), {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const setOpen = useCallback(
    (detailsOpen: boolean) => {
      setOpenState(detailsOpen);
      syncOpenToUrl(detailsOpen);
    },
    [syncOpenToUrl],
  );

  useEffect(() => {
    setOpenState(parseRunPipelineTimelineOpenFromSearch(runPipelineTimelineOpenParam));
  }, [runPipelineTimelineOpenParam]);

  return (
    <section
      id="pipeline-timeline"
      className="scroll-mt-24"
      aria-labelledby="pipeline-timeline-title"
    >
      <CollapsibleSection
        title={auditTrailLabel}
        headingLevel={3}
        summaryId="pipeline-timeline-title"
        summaryLine={summaryLine}
        open={open}
        onToggle={setOpen}
        sectionTestId="run-pipeline-timeline-collapsible"
      >
        <p className={cn("m-0 mb-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          {auditTrailDescription(runId, props.buyerPolishedArtifactTable)}
        </p>
        {pipelineTimelineBody(props)}
      </CollapsibleSection>
    </section>
  );
}
