"use client";

import Link from "next/link";

import { OperatorDemoStaticBanner } from "@/components/operator/OperatorDemoStaticBanner";
import { ProvenanceWayfinding } from "@/components/provenance/ProvenanceWayfinding";
import { ProvenancePickReviewBeforeInspectingStrip } from "@/components/provenance/ProvenancePickReviewBeforeInspectingStrip";
import { RunProvenanceEvidenceGraphVocabularyRail } from "@/components/runs/RunProvenanceEvidenceGraphVocabularyRail";
import { RunTraceViewerLink } from "@/components/runs/RunTraceViewerLink";
import { StatusTag } from "@/components/ui/status-tag";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { shouldOmitClaimDisciplineBand } from "@/lib/claim-discipline-policy";
import {
  PROVENANCE_CLAIM_DISCIPLINE,
  PROVENANCE_PAGE_TITLE,
  PROVENANCE_SECTION_LINKAGE_POINTS_LABEL,
  PROVENANCE_SECTION_RELATIONSHIPS_LABEL,
} from "@/lib/provenance-evidence-copy";
import type { ProvenanceReviewContext } from "@/components/provenance/provenance-page-workspace-types";
import type { ArchitectureRunProvenanceGraph } from "@/types/architecture-provenance";
import { cn } from "@/lib/utils";

export type ProvenancePageWorkspaceHeaderProps = {
  readonly dataOrigin: string;
  readonly scopedRunId: string;
  readonly onPickReviewForInspecting: (reviewId: string) => void;
  readonly reviewHref: string;
  readonly reviewContext: ProvenanceReviewContext | null;
  readonly reviewTitle: string;
  readonly graph: ArchitectureRunProvenanceGraph;
  readonly provenanceTraceId: string | null;
  readonly evidenceGraphHref: string;
};

export function ProvenancePageWorkspaceHeader({
  dataOrigin,
  scopedRunId,
  onPickReviewForInspecting,
  reviewHref,
  reviewContext,
  reviewTitle,
  graph,
  provenanceTraceId,
  evidenceGraphHref,
}: ProvenancePageWorkspaceHeaderProps) {
  return (
    <>
      {dataOrigin === "sample" ? <OperatorDemoStaticBanner emphasizeSampleData /> : null}

      {scopedRunId.length === 0 ? (
        <ProvenancePickReviewBeforeInspectingStrip
          selectedReviewId={scopedRunId}
          onSelectReview={onPickReviewForInspecting}
        />
      ) : (
        <p
          className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}
          data-testid="provenance-run-scope-banner"
        >
          {"Inspecting provenance for review "}
          <span className="font-mono text-neutral-900 dark:text-neutral-100">{scopedRunId}</span>
          {" · "}
          <Link className={OPERATOR_LINK.nav} href={reviewHref}>
            Open review
          </Link>
          {" · "}
          <Link className={OPERATOR_LINK.nav} href="/architecture/reviews">
            All reviews
          </Link>
        </p>
      )}

      <header className="space-y-2">
        <ProvenanceWayfinding reviewPackageHref={reviewHref} />
        <RunProvenanceEvidenceGraphVocabularyRail currentSurfaceId="run-provenance" />
        <div className="flex flex-wrap items-center gap-2">
          <h2 className={cn("m-0", OPERATOR_TYPOGRAPHY.pageTitle)}>{PROVENANCE_PAGE_TITLE}</h2>
          {reviewContext?.statusLabel !== null &&
          reviewContext?.statusLabel !== undefined &&
          reviewContext.statusLabel.length > 0 &&
          reviewContext.statusTagKind !== null &&
          reviewContext.statusTagKind !== undefined ? (
            <StatusTag kind={reviewContext.statusTagKind} label={reviewContext.statusLabel} />
          ) : null}
        </div>
        {reviewTitle.length > 0 ? (
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
            Evidence trail for{" "}
            <span className="font-medium text-neutral-900 dark:text-neutral-100">{reviewTitle}</span>
          </p>
        ) : null}
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
          {graph.nodes.length} {PROVENANCE_SECTION_LINKAGE_POINTS_LABEL.toLowerCase()},{" "}
          {graph.edges.length} {PROVENANCE_SECTION_RELATIONSHIPS_LABEL.toLowerCase()},{" "}
          {graph.timeline.length} recorded events.
        </p>
        <details className="rounded-md border border-neutral-200 px-3 py-2 dark:border-neutral-700">
          <summary className={cn("cursor-pointer text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.micro)}>
            Review identifier
          </summary>
          <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.micro)}>
            <code className="rounded bg-neutral-100 px-1 dark:bg-neutral-800">{graph.runId}</code>
          </p>
        </details>
        <RunTraceViewerLink traceId={provenanceTraceId} />
        {shouldOmitClaimDisciplineBand("provenance") ? null : (
          <p
            className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
            data-testid="provenance-claim-discipline"
          >
            {PROVENANCE_CLAIM_DISCIPLINE}
          </p>
        )}
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
          <Link className={OPERATOR_LINK.nav} href={evidenceGraphHref}>
            Open Evidence graph
          </Link>
          {" Â· "}
          <Link className={OPERATOR_LINK.nav} href="/insights/search-review-evidence">
            Search review evidence
          </Link>
        </p>
      </header>

      {graph.traceabilityGaps.length > 0 ? (
        <section
          id="trace-gaps"
          aria-labelledby="trace-gaps-heading"
          className={cn(
            "rounded-md border border-amber-600/40 bg-al-surface-raised px-3 py-2 text-al-text-primary dark:border-amber-700/50",
            OPERATOR_TYPOGRAPHY.body,
          )}
        >
          <h3 id="trace-gaps-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
            Traceability gaps
          </h3>
          <ul className={cn("m-0 mt-2 list-disc space-y-1 pl-5", OPERATOR_TYPOGRAPHY.body)}>
            {graph.traceabilityGaps.map((gap) => (
              <li key={gap}>{gap}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}
