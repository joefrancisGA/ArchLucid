"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { OperatorDemoStaticBanner } from "@/components/operator/OperatorDemoStaticBanner";
import { ProvenanceWayfinding } from "@/components/provenance/ProvenanceWayfinding";
import { ProvenancePickReviewBeforeInspectingStrip } from "@/components/provenance/ProvenancePickReviewBeforeInspectingStrip";
import { RunProvenanceEvidenceGraphVocabularyRail } from "@/components/runs/RunProvenanceEvidenceGraphVocabularyRail";
import { RunTraceViewerLink } from "@/components/runs/RunTraceViewerLink";
import { StatusTag } from "@/components/ui/status-tag";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { shouldOmitClaimDisciplineBand } from "@/lib/claim-discipline-policy";
import { PIPELINE_STATUS_LABELS } from "@/lib/pipeline-status-labels";
import { truncateMiddle } from "@/lib/truncate-middle";
import {
  PROVENANCE_CLAIM_DISCIPLINE,
  PROVENANCE_PAGE_TITLE,
  PROVENANCE_SECTION_LINKAGE_POINTS_LABEL,
  PROVENANCE_SECTION_RELATIONSHIPS_LABEL,
} from "@/lib/provenance-evidence-copy";
import type { ProvenanceReviewContext } from "@/components/provenance/provenance-page-workspace-types";
import type { ArchitectureRunProvenanceGraph } from "@/types/architecture-provenance";
import { cn } from "@/lib/utils";
import {
  parseProvenanceReviewIdentifierOpenFromSearch,
  provenanceReviewIdentifierDisclosureHrefFromSearch,
} from "@/lib/provenance/provenance-review-identifier-disclosure-url";

export type ProvenancePageWorkspaceHeaderProps = {
  readonly dataOrigin: string;
  readonly scopedRunId: string;
  readonly onPickReviewForInspecting: (reviewId: string) => void;
  readonly reviewHref: string;
  readonly reviewContext: ProvenanceReviewContext | null;
  readonly reviewTitle: string;
  readonly graph: ArchitectureRunProvenanceGraph;
  readonly provenanceTraceId: string | null;
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
}: ProvenancePageWorkspaceHeaderProps) {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const provenanceReviewIdentifierOpenParam = searchParams.get("provenanceReviewIdentifierOpen");
  const [reviewIdentifierOpen, setReviewIdentifierOpenState] = useState(() =>
    parseProvenanceReviewIdentifierOpenFromSearch(provenanceReviewIdentifierOpenParam),
  );

  const syncReviewIdentifierOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(
        provenanceReviewIdentifierDisclosureHrefFromSearch(searchParams.toString(), open, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setReviewIdentifierOpen = useCallback(
    (open: boolean) => {
      setReviewIdentifierOpenState(open);
      syncReviewIdentifierOpenToUrl(open);
    },
    [syncReviewIdentifierOpenToUrl],
  );

  useEffect(() => {
    setReviewIdentifierOpenState(parseProvenanceReviewIdentifierOpenFromSearch(provenanceReviewIdentifierOpenParam));
  }, [provenanceReviewIdentifierOpenParam]);

  const scopedReviewIdLabel = truncateMiddle(scopedRunId, 20);
  const provenanceLoaded = graph.nodes.length > 0;
  const statusLabel = reviewContext?.statusLabel ?? "";
  const statusTagKind = reviewContext?.statusTagKind;
  const showPipelineStatusTag =
    statusLabel.length > 0 &&
    statusTagKind !== null &&
    statusTagKind !== undefined &&
    !(provenanceLoaded && statusLabel === PIPELINE_STATUS_LABELS.starting);

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
          <span
            className="font-mono text-neutral-900 dark:text-neutral-100"
            title={scopedRunId}
          >
            {scopedReviewIdLabel}
          </span>
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
          {showPipelineStatusTag && statusTagKind !== undefined ? (
            <StatusTag kind={statusTagKind} label={statusLabel} />
          ) : null}
        </div>
        {reviewTitle.length > 0 ? (
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
            Evidence provenance for{" "}
            <span className="font-medium text-neutral-900 dark:text-neutral-100">{reviewTitle}</span>
          </p>
        ) : null}
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
          {graph.nodes.length} {PROVENANCE_SECTION_LINKAGE_POINTS_LABEL.toLowerCase()},{" "}
          {graph.edges.length} {PROVENANCE_SECTION_RELATIONSHIPS_LABEL.toLowerCase()},{" "}
          {graph.timeline.length} recorded events.
        </p>
        <details
          className="rounded-md border border-neutral-200 px-3 py-2 dark:border-neutral-700"
          open={reviewIdentifierOpen}
          onToggle={(event) => {
            setReviewIdentifierOpen((event.currentTarget as HTMLDetailsElement).open);
          }}
        >
          <summary className={cn("cursor-pointer text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.micro)}>
            Review identifier
          </summary>
          <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.micro)}>
            <code className="rounded bg-neutral-100 px-1 dark:bg-neutral-800">{graph.runId}</code>
          </p>
          {provenanceTraceId !== null && provenanceTraceId.length > 0 ? (
            <div className="mt-2">
              <RunTraceViewerLink traceId={provenanceTraceId} presentation="disclosure-body" />
            </div>
          ) : null}
        </details>
        {shouldOmitClaimDisciplineBand("provenance") ? null : (
          <p
            className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
            data-testid="provenance-claim-discipline"
          >
            {PROVENANCE_CLAIM_DISCIPLINE}
          </p>
        )}
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
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
