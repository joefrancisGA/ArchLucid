"use client";

import { cn } from "@/lib/utils";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useAdvisoryRecommendationsQuery } from "@/hooks/use-advisory-recommendations-query";
import { useOperatorScopeQueryKey } from "@/hooks/use-operator-scope-query-key";

import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { AdvisoryRecommendationCard } from "@/components/advisory/AdvisoryRecommendationCard";
import { AdvisoryScanForm } from "@/components/advisory/AdvisoryScanForm";
import { AdvisoryScansListHeader } from "@/components/advisory/AdvisoryScansListHeader";
import { RecommendationImproveLoopEvidencePanel } from "@/components/advisory/RecommendationImproveLoopEvidencePanel";
import { AdvisoryScansTriageFirstPendingStrip } from "@/components/advisory/AdvisoryScansTriageFirstPendingStrip";
import { AdvisoryRecommendationDispositionDialog } from "@/components/advisory/AdvisoryRecommendationDispositionDialog";
import { AdvisorySampleRecommendationPreview } from "@/components/advisory/AdvisorySampleRecommendationPreview";
import { AdvisoryScanSummaryPanel } from "@/components/advisory/AdvisoryScanSummaryPanel";
import { AdvisoryScansPickReviewBeforeScanningStrip } from "@/components/advisory/AdvisoryScansPickReviewBeforeScanningStrip";
import { AdvisoryScansNextReviewFooterClient } from "@/components/advisory/AdvisoryScansNextReviewFooterClient";
import { AdvisoryResultsSchedulesVocabularyRail } from "@/components/AdvisoryResultsSchedulesVocabularyRail";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { useNavCallerAuthorityRank } from "@/components/operator/OperatorNavAuthorityProvider";
import { PageCapabilityBoundaryStrip } from "@/components/PageCapabilityBoundaryStrip";
import { Button } from "@/components/ui/button";
import { applyRecommendationAction, listRecommendations } from "@/lib/advisory-api";
import { resolveAdvisoryScansTriageFirstPending } from "@/lib/advisory/resolve-advisory-scans-triage-first-pending";
import { resolveCurrentProjectLabel } from "@/lib/advisory-schedule-page-model";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import {
  ADVISORY_SCANS_DISPOSITION_ACCEPT,
  ADVISORY_SCANS_DISPOSITION_DEFER,
  ADVISORY_SCANS_DISPOSITION_IMPLEMENTED,
  ADVISORY_SCANS_DISPOSITION_REJECT,
  ADVISORY_SCANS_GENERATE_DISABLED_HINT,
  ADVISORY_SCANS_HOW_IT_WORKS_BODY,
  ADVISORY_SCANS_HOW_IT_WORKS_TITLE,
  ADVISORY_SCANS_OPEN_REVIEW_PACKAGES_HREF,
  ADVISORY_SCANS_OPEN_REVIEW_PACKAGES_LABEL,
  ADVISORY_SCANS_RECOMMENDATIONS_SECTION_BODY,
  ADVISORY_SCANS_RECOMMENDATIONS_SECTION_TITLE,
  ADVISORY_SCANS_VIEW_SAMPLE_LABEL,
} from "@/lib/advisory-copy";
import { buildAdvisoryScanSummary } from "@/lib/advisory-scan-summary";
import {
  resolveAdvisoryScansScanEmphasizedStepId,
  resolveAdvisoryScansScanSteps,
} from "@/lib/advisory-scans-scan-checklist";
import { getImprovementPlan } from "@/lib/api";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { showSuccess } from "@/lib/toast";
import { OPERATOR_TYPOGRAPHY, OPERATOR_BODY_INLINE_LINK_CLASS } from "@/lib/design-tokens";
import { buildAdvisoryHubHref } from "@/lib/advisory-hub-href";
import { isExperimentalAdvisoryPanelsEnabled } from "@/lib/feature-flags";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import {
  ARCHLUCID_OPERATOR_SCOPE_CHANGED_EVENT,
  readOperatorScopeFromStorage,
} from "@/lib/operator/operator-scope-storage";
import type { WhyDisabledCtaReason } from "@/lib/why-disabled-cta";
import type { ImprovementPlan, RecommendationImproveLoopEvidence, RecommendationRecord } from "@/types/advisory";

export type AdvisoryScansContentProps = {
  /** Optional product-run scope from `?runId=` deep links. */
  readonly initialRunId?: string | null;
};

const DISPOSITION_ACTION_LABELS: Readonly<Record<string, string>> = {
  Accept: ADVISORY_SCANS_DISPOSITION_ACCEPT,
  Defer: ADVISORY_SCANS_DISPOSITION_DEFER,
  Reject: ADVISORY_SCANS_DISPOSITION_REJECT,
  MarkImplemented: ADVISORY_SCANS_DISPOSITION_IMPLEMENTED,
};

function dispositionActionLabel(action: string): string {
  return DISPOSITION_ACTION_LABELS[action] ?? action;
}

/**
 * Scans tab: governance follow-up workspace for advisory recommendations.
 */
export function AdvisoryScansContent(props: AdvisoryScansContentProps = {}): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname();
  const callerAuthorityRank = useNavCallerAuthorityRank();
  const isAdminCaller = callerAuthorityRank >= AUTHORITY_RANK.AdminAuthority;
  const bootstrappedRunId = (props.initialRunId ?? "").trim();

  const onPickReview = useCallback(
    (reviewId: string) => {
      const trimmed = reviewId.trim();

      if (trimmed.length === 0) {
        return;
      }

      router.push(buildAdvisoryHubHref({ pathname, tab: "scans", runId: trimmed }));
    },
    [pathname, router],
  );

  const scansClearScopeHref = buildAdvisoryHubHref({ pathname, tab: "scans", runId: null });
  const queryClient = useQueryClient();
  const scope = useOperatorScopeQueryKey();
  const generateDisabledHintId = useId();
  const samplePreviewRegionId = useId();
  const samplePreviewTriggerId = useId();
  const samplePreviewRegionRef = useRef<HTMLDivElement>(null);

  const [runId, setRunId] = useState(bootstrappedRunId);
  const [compareToRunId, setCompareToRunId] = useState("");
  const [planSummary, setPlanSummary] = useState<ImprovementPlan | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [failure, setFailure] = useState<ApiLoadFailureState | null>(null);
  const [showSamplePreview, setShowSamplePreview] = useState(false);
  const [pendingDisposition, setPendingDisposition] = useState<{
    readonly recommendationId: string;
    readonly action: string;
  } | null>(null);
  const [dispositionBusy, setDispositionBusy] = useState(false);
  const [dispositionError, setDispositionError] = useState<string | null>(null);
  const [lastImproveLoopEvidence, setLastImproveLoopEvidence] =
    useState<RecommendationImproveLoopEvidence | null>(null);
  const [projectLabel, setProjectLabel] = useState("Current project");
  const [lastLoadedUtc, setLastLoadedUtc] = useState<string | null>(null);
  const bootstrapRecommendationsQuery = useAdvisoryRecommendationsQuery(bootstrappedRunId, {
    enabled: bootstrappedRunId.length > 0,
  });

  const syncProjectContext = useCallback(() => {
    const operatorScope = readOperatorScopeFromStorage();
    setProjectLabel(resolveCurrentProjectLabel(operatorScope?.projectLabel));
  }, []);

  useEffect(() => {
    syncProjectContext();

    const onScopeChanged = () => {
      syncProjectContext();
      setPlanSummary(null);
      setRecommendations([]);
      setLastLoadedUtc(null);
      setFailure(null);
      setShowSamplePreview(false);
      void queryClient.invalidateQueries({
        queryKey: ["operator", "advisory", "recommendations", scope],
      });
    };

    window.addEventListener(ARCHLUCID_OPERATOR_SCOPE_CHANGED_EVENT, onScopeChanged);

    return () => {
      window.removeEventListener(ARCHLUCID_OPERATOR_SCOPE_CHANGED_EVENT, onScopeChanged);
    };
  }, [queryClient, scope, syncProjectContext]);

  useEffect(() => {
    if (bootstrappedRunId.length === 0) {
      return;
    }

    if (bootstrapRecommendationsQuery.isPending) {
      setLoading(true);
    }
  }, [bootstrappedRunId, bootstrapRecommendationsQuery.isPending]);

  const reviewSelected = runId.trim().length > 0;
  const hasResults = planSummary !== null || recommendations.length > 0;
  const advisoryScanChecklistSteps = resolveAdvisoryScansScanSteps({
    reviewPicked: reviewSelected,
    scanConfigured: reviewSelected,
    scanComplete: hasResults || lastLoadedUtc !== null,
  });
  const advisoryScanChecklistEmphasizedStepId = resolveAdvisoryScansScanEmphasizedStepId({
    reviewPicked: reviewSelected,
    scanConfigured: reviewSelected,
    scanComplete: hasResults || lastLoadedUtc !== null,
  });
  const generateDisabledReason: WhyDisabledCtaReason | null = reviewSelected
    ? null
    : { kind: "prerequisite", message: ADVISORY_SCANS_GENERATE_DISABLED_HINT };

  useEffect(() => {
    if (hasResults) {
      setShowSamplePreview(false);
    }
  }, [hasResults]);

  useEffect(() => {
    const next = (props.initialRunId ?? "").trim();

    if (next.length === 0) {
      return;
    }

    setRunId(next);
  }, [props.initialRunId]);

  useEffect(() => {
    if (bootstrapRecommendationsQuery.data === undefined) {
      return;
    }

    setRecommendations(bootstrapRecommendationsQuery.data.recommendations);
    setLastImproveLoopEvidence(bootstrapRecommendationsQuery.data.improveLoopEvidence ?? null);
    setLoading(false);
    setLastLoadedUtc(new Date().toISOString());
  }, [bootstrapRecommendationsQuery.data]);

  useEffect(() => {
    if (!bootstrapRecommendationsQuery.isError) {
      return;
    }

    setFailure(toApiLoadFailure(bootstrapRecommendationsQuery.error));
    setLoading(false);
  }, [bootstrapRecommendationsQuery.error, bootstrapRecommendationsQuery.isError]);

  useEffect(() => {
    if (!showSamplePreview) {
      return;
    }

    const region = samplePreviewRegionRef.current;

    if (region === null) {
      return;
    }

    region.scrollIntoView({ behavior: "smooth", block: "start" });
    region.focus({ preventScroll: true });
  }, [showSamplePreview]);

  const fetchPersistedRecommendations = useCallback(
    async (rid: string): Promise<RecommendationRecord[]> => {
      const queryKey = operatorQueryKeys.advisoryRecommendations(scope, rid);

      await queryClient.invalidateQueries({ queryKey });

      const data = await queryClient.fetchQuery({
        queryKey,
        queryFn: () => listRecommendations(rid),
        staleTime: 0,
      });

      setLastImproveLoopEvidence(data.improveLoopEvidence ?? null);

      return data.recommendations;
    },
    [queryClient, scope],
  );

  const scanSummary = useMemo(
    () => buildAdvisoryScanSummary(recommendations, planSummary, compareToRunId),
    [compareToRunId, planSummary, recommendations],
  );
  const triageFirstPending = useMemo(
    () => resolveAdvisoryScansTriageFirstPending(recommendations),
    [recommendations],
  );

  const submitDisposition = useCallback(
    async (comment: string, rationale: string): Promise<void> => {
      if (pendingDisposition === null) {
        return;
      }

      setDispositionBusy(true);
      setDispositionError(null);
      setFailure(null);

      try {
        const actionResult = await applyRecommendationAction(
          pendingDisposition.recommendationId,
          pendingDisposition.action,
          comment,
          rationale,
        );

        if (actionResult.improveLoop) {
          setLastImproveLoopEvidence(actionResult.improveLoop);
        }

        if (actionResult.improveLoop?.mergedFindingIds?.length) {
          showSuccess(
            `Improve loop merged ${actionResult.improveLoop.mergedFindingIds.length} finding(s) into the review snapshot.`,
          );
        } else if (actionResult.improveLoop?.fullReReviewTriggered) {
          showSuccess("Improve loop triggered a full architecture re-review.");
        }

        const rid = runId.trim();

        if (rid.length > 0) {
          const refreshed = await fetchPersistedRecommendations(rid);
          setRecommendations(refreshed);
          setLastLoadedUtc(new Date().toISOString());
        }

        setPendingDisposition(null);
      } catch (error) {
        setDispositionError(toApiLoadFailure(error).message);
      } finally {
        setDispositionBusy(false);
      }
    },
    [fetchPersistedRecommendations, pendingDisposition, runId],
  );

  const loadAdvice = useCallback(async () => {
    const rid = runId.trim();

    if (rid.length === 0) {
      return;
    }

    setLoading(true);
    setFailure(null);

    try {
      const data = await getImprovementPlan(rid, compareToRunId.trim() || undefined);
      setPlanSummary(data);
      const persisted = await fetchPersistedRecommendations(rid);
      setRecommendations(persisted);
      setLastLoadedUtc(new Date().toISOString());
    } catch (error) {
      setFailure(toApiLoadFailure(error));
      setPlanSummary(null);
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  }, [compareToRunId, fetchPersistedRecommendations, runId]);

  const refreshPersistedOnly = useCallback(async () => {
    const rid = runId.trim();

    if (rid.length === 0) {
      return;
    }

    setLoading(true);
    setFailure(null);

    try {
      const persisted = await fetchPersistedRecommendations(rid);
      setRecommendations(persisted);
      setLastLoadedUtc(new Date().toISOString());
    } catch (error) {
      setFailure(toApiLoadFailure(error));
    } finally {
      setLoading(false);
    }
  }, [fetchPersistedRecommendations, runId]);

  const toggleSamplePreview = useCallback((): void => {
    setShowSamplePreview((current) => !current);
  }, []);

  return (
    <OperatorPageContainer variant="workflow" data-testid="advisory-scans-content">
      <AdvisoryScansListHeader
        projectLabel={projectLabel}
        recommendationCount={recommendations.length}
        lastLoadedUtc={lastLoadedUtc}
        loading={loading}
        onRefresh={() => {
          void refreshPersistedOnly();
        }}
      />

      {runId.trim().length === 0 ? (
        <AdvisoryScansPickReviewBeforeScanningStrip selectedReviewId="" onSelectReview={onPickReview} />
      ) : (
        <>
          <p
            className={cn("m-0 mb-4 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
            data-testid="advisory-scans-run-scope-banner"
          >
            {"Scanning advisory recommendations for review "}
            <span className="font-mono text-al-text-primary">{bootstrappedRunId}</span>
            {" · "}
            <Link className={OPERATOR_BODY_INLINE_LINK_CLASS} href={scansClearScopeHref}>
              Clear review scope
            </Link>
            {" · "}
            <Link
              className={OPERATOR_BODY_INLINE_LINK_CLASS}
              href={`/architecture/reviews/${encodeURIComponent(bootstrappedRunId)}`}
            >
              Open review
            </Link>
          </p>
          <AdvisoryScanForm
          bootstrappedRunId={bootstrappedRunId}
          reviewSelected={reviewSelected}
          loading={loading}
          runId={runId}
          setRunId={setRunId}
          compareToRunId={compareToRunId}
          setCompareToRunId={setCompareToRunId}
          isAdminCaller={isAdminCaller}
          advisoryScanChecklistSteps={advisoryScanChecklistSteps}
          advisoryScanChecklistEmphasizedStepId={advisoryScanChecklistEmphasizedStepId}
          generateDisabledHintId={generateDisabledHintId}
          generateDisabledReason={generateDisabledReason}
          onGenerate={() => {
            void loadAdvice();
          }}
          onRefreshSaved={() => {
            void refreshPersistedOnly();
          }}
        />
        </>
      )}

      {!hasResults ? (
        <div className="mb-6 flex flex-wrap items-center gap-2" data-testid="advisory-scans-empty-actions">
          <Button
            type="button"
            size="sm"
            variant="outline"
            id={samplePreviewTriggerId}
            aria-expanded={showSamplePreview}
            aria-controls={samplePreviewRegionId}
            data-testid="advisory-empty-view-sample-cta"
            onClick={toggleSamplePreview}
          >
            {ADVISORY_SCANS_VIEW_SAMPLE_LABEL}
          </Button>

          <Button asChild size="sm" variant="outline">
            <Link
              href={ADVISORY_SCANS_OPEN_REVIEW_PACKAGES_HREF}
              data-testid="advisory-empty-open-reviews-link"
            >
              {ADVISORY_SCANS_OPEN_REVIEW_PACKAGES_LABEL}
            </Link>
          </Button>
        </div>
      ) : null}

      {failure !== null ? (
        <div role="alert">
          <OperatorApiProblem
            problem={failure.problem}
            fallbackMessage={failure.message}
            correlationId={failure.correlationId}
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

      {hasResults ? <AdvisoryScanSummaryPanel summary={scanSummary} /> : null}

      {planSummary !== null && planSummary.summaryNotes.length > 0 ? (
        <section className="mb-6 space-y-2">
          <h3 className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
            Scan notes
          </h3>
          <ul className={cn("m-0 list-disc space-y-1 pl-5 leading-relaxed", OPERATOR_TYPOGRAPHY.body)}>
            {planSummary.summaryNotes.map((note, index) => (
              <li key={index}>{note}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {lastImproveLoopEvidence !== null ? (
        <RecommendationImproveLoopEvidencePanel evidence={lastImproveLoopEvidence} />
      ) : null}

      {recommendations.length > 0 ? (
        <section className="space-y-4" data-testid="advisory-recommendations-list">
          {triageFirstPending !== null ? (
            <AdvisoryScansTriageFirstPendingStrip
              target={triageFirstPending}
              onReviewRecommendation={(recommendationId) => {
                setDispositionError(null);
                setPendingDisposition({ recommendationId, action: "Accept" });
              }}
            />
          ) : null}
          <div className="space-y-1">
            <h3 className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
              {ADVISORY_SCANS_RECOMMENDATIONS_SECTION_TITLE}
            </h3>
            <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
              {ADVISORY_SCANS_RECOMMENDATIONS_SECTION_BODY}
            </p>
          </div>

          <div className="grid gap-4">
            {recommendations.map((recommendation) => (
              <AdvisoryRecommendationCard
                key={recommendation.recommendationId}
                recommendation={recommendation}
                onAction={(recommendationId, action) => {
                  setDispositionError(null);
                  setPendingDisposition({ recommendationId, action });
                }}
              />
            ))}
          </div>
        </section>
      ) : planSummary !== null && recommendations.length === 0 ? (
        <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
          No persisted recommendations returned for this architecture review.
        </p>
      ) : null}

      {showSamplePreview ? (
        <div
          ref={samplePreviewRegionRef}
          id={samplePreviewRegionId}
          tabIndex={-1}
          className="mt-4 space-y-3 outline-none"
          data-testid="advisory-sample-preview-region"
          aria-labelledby={samplePreviewTriggerId}
        >
          <AdvisorySampleRecommendationPreview />
        </div>
      ) : null}

      <div className="mt-8 space-y-4" data-testid="advisory-scans-orientation-footer">
        {runId.trim().length > 0 ? <AdvisoryScansNextReviewFooterClient runId={runId.trim()} /> : null}
        <AdvisoryResultsSchedulesVocabularyRail currentSurfaceId="advisory-results" />
        <PageCapabilityBoundaryStrip surfaceId="advisoryScans" />
        <CollapsibleSection title={ADVISORY_SCANS_HOW_IT_WORKS_TITLE} sectionTestId="advisory-scans-how-it-works">
          <p className={cn("m-0 max-w-3xl text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
            {ADVISORY_SCANS_HOW_IT_WORKS_BODY}
          </p>
        </CollapsibleSection>
      </div>

      <AdvisoryRecommendationDispositionDialog
        open={pendingDisposition !== null}
        onOpenChange={(open) => {
          if (!open && !dispositionBusy) {
            setPendingDisposition(null);
            setDispositionError(null);
          }
        }}
        actionLabel={
          pendingDisposition !== null ? dispositionActionLabel(pendingDisposition.action) : null
        }
        busy={dispositionBusy}
        errorMessage={dispositionError}
        onConfirm={(comment, rationale) => {
          void submitDisposition(comment, rationale);
        }}
      />
    </OperatorPageContainer>
  );
}
