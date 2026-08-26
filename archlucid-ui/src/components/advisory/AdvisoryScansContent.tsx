"use client";

import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { AdvisoryScansListHeader } from "@/components/advisory/AdvisoryScansListHeader";
import { AdvisoryScansNextReviewFooterClient } from "@/components/advisory/AdvisoryScansNextReviewFooterClient";
import { AdvisoryResultsSchedulesVocabularyRail } from "@/components/AdvisoryResultsSchedulesVocabularyRail";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { PageCapabilityBoundaryStrip } from "@/components/PageCapabilityBoundaryStrip";
import {
  ADVISORY_SCANS_HOW_IT_WORKS_BODY,
  ADVISORY_SCANS_HOW_IT_WORKS_TITLE,
} from "@/lib/advisory-copy";
import { isExperimentalAdvisoryPanelsEnabled } from "@/lib/feature-flags";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

import { AdvisoryScansResultsPanel } from "./AdvisoryScansResultsPanel";
import { AdvisoryScansToolbar } from "./AdvisoryScansToolbar";
import {
  useAdvisoryScansContent,
  type AdvisoryScansContentProps,
} from "./use-advisory-scans-content";

export type { AdvisoryScansContentProps };

/**
 * Scans tab: governance follow-up workspace for advisory recommendations.
 */
export function AdvisoryScansContent(props: AdvisoryScansContentProps = {}): React.JSX.Element {
  const content = useAdvisoryScansContent(props);

  return (
    <OperatorPageContainer variant="workflow" data-testid="advisory-scans-content">
      <AdvisoryScansListHeader
        projectLabel={content.projectLabel}
        recommendationCount={content.recommendations.length}
        lastLoadedUtc={content.lastLoadedUtc}
        loading={content.loading}
        onRefresh={() => {
          void content.refreshPersistedOnly();
        }}
      />

      <AdvisoryScansToolbar content={content} />

      {content.failure !== null ? (
        <div role="alert">
          <OperatorApiProblem
            problem={content.failure.problem}
            fallbackMessage={content.failure.message}
            correlationId={content.failure.correlationId}
          />
        </div>
      ) : null}

      {isExperimentalAdvisoryPanelsEnabled() ? (
        <section
          aria-label="Experimental advisory panels"
          className="mb-4 rounded-lg border border-dashed border-neutral-400 p-3 dark:border-neutral-500"
        >
          <h3 className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>Experimental</h3>
          <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
            Optional panels for in-development advisory UX. Enable with{" "}
            <code
              className={cn("rounded bg-neutral-200 px-1 dark:bg-neutral-800", OPERATOR_TYPOGRAPHY.helper)}
            >
              NEXT_PUBLIC_EXPERIMENTAL_ADVISORY_PANELS=true
            </code>{" "}
            at build time.
          </p>
        </section>
      ) : null}

      <AdvisoryScansResultsPanel content={content} />

      <div className="mt-8 space-y-4" data-testid="advisory-scans-orientation-footer">
        {content.runId.trim().length > 0 ? <AdvisoryScansNextReviewFooterClient runId={content.runId.trim()} /> : null}
        <AdvisoryResultsSchedulesVocabularyRail currentSurfaceId="advisory-results" />
        <PageCapabilityBoundaryStrip surfaceId="advisoryScans" />
        <CollapsibleSection title={ADVISORY_SCANS_HOW_IT_WORKS_TITLE} sectionTestId="advisory-scans-how-it-works">
          <p className={cn("m-0 max-w-3xl text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
            {ADVISORY_SCANS_HOW_IT_WORKS_BODY}
          </p>
        </CollapsibleSection>
      </div>
    </OperatorPageContainer>
  );
}
