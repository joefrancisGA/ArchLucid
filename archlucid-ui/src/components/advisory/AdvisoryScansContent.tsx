"use client";

import { cn } from "@/lib/utils";

import Link from "next/link";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useAdvisoryRecommendationsQuery } from "@/hooks/use-advisory-recommendations-query";
import { useOperatorScopeQueryKey } from "@/hooks/use-operator-scope-query-key";

import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { AdvisoryRecommendationCard } from "@/components/advisory/AdvisoryRecommendationCard";
import { AdvisoryScansTriageFirstPendingStrip } from "@/components/advisory/AdvisoryScansTriageFirstPendingStrip";
import { AdvisoryRecommendationDispositionDialog } from "@/components/advisory/AdvisoryRecommendationDispositionDialog";
import { AdvisorySampleRecommendationPreview } from "@/components/advisory/AdvisorySampleRecommendationPreview";
import { AdvisoryScanSummaryPanel } from "@/components/advisory/AdvisoryScanSummaryPanel";
import { AdvisoryResultsSchedulesVocabularyRail } from "@/components/AdvisoryResultsSchedulesVocabularyRail";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { useNavCallerAuthorityRank } from "@/components/operator/OperatorNavAuthorityProvider";
import { PageCapabilityBoundaryStrip } from "@/components/PageCapabilityBoundaryStrip";
import { RunIdPicker } from "@/components/runs/RunIdPicker";
import { WhyDisabledCtaHint } from "@/components/usability/WhyDisabledCtaHint";
import { Button } from "@/components/ui/button";
import { RefreshButton } from "@/components/ui/refresh-button";
import { applyRecommendationAction, listRecommendations } from "@/lib/advisory-api";
import { resolveAdvisoryScansTriageFirstPending } from "@/lib/advisory/resolve-advisory-scans-triage-first-pending";
import { resolveCurrentProjectLabel } from "@/lib/advisory-schedule-page-model";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import {
  ADVISORY_SCANS_BASELINE_REVIEW_HELPER,
  ADVISORY_SCANS_BASELINE_REVIEW_LABEL,
  ADVISORY_SCANS_BASELINE_REVIEW_PLACEHOLDER,
  ADVISORY_SCANS_CANT_FIND_REVIEW_BODY,
  ADVISORY_SCANS_CANT_FIND_REVIEW_SUMMARY,
  ADVISORY_SCANS_DISPOSITION_ACCEPT,
  ADVISORY_SCANS_DISPOSITION_DEFER,
  ADVISORY_SCANS_DISPOSITION_IMPLEMENTED,
  ADVISORY_SCANS_DISPOSITION_REJECT,
  ADVISORY_SCANS_FINALIZED_REVIEW_LABEL,
  ADVISORY_SCANS_FINALIZED_REVIEW_PLACEHOLDER,
  ADVISORY_SCANS_FORM_SECTION_TITLE,
  ADVISORY_SCANS_GENERATE_BUTTON_LABEL,
  ADVISORY_SCANS_GENERATE_BUTTON_WORKING_LABEL,
  ADVISORY_SCANS_GENERATE_DISABLED_HINT,
  ADVISORY_SCANS_GENERATE_OUTPUT_HINT,
  ADVISORY_SCANS_HOW_IT_WORKS_BODY,
  ADVISORY_SCANS_HOW_IT_WORKS_TITLE,
  ADVISORY_SCANS_INLINE_CAPABILITY_BOUNDARY,
  ADVISORY_SCANS_LAST_LOADED_PREFIX,
  ADVISORY_SCANS_LIST_COUNT_LABEL,
  ADVISORY_SCANS_LIST_HEADING,
  ADVISORY_SCANS_MANUAL_ID_ADMIN_SUMMARY,
  ADVISORY_SCANS_MANUAL_ID_BASELINE_PLACEHOLDER,
  ADVISORY_SCANS_MANUAL_ID_TARGET_PLACEHOLDER,
  ADVISORY_SCANS_OPEN_REVIEW_PACKAGES_HREF,
  ADVISORY_SCANS_OPEN_REVIEW_PACKAGES_LABEL,
  ADVISORY_SCANS_RECOMMENDATIONS_SECTION_BODY,
  ADVISORY_SCANS_RECOMMENDATIONS_SECTION_TITLE,
  ADVISORY_SCANS_REFRESH_SAVED_LABEL,
  ADVISORY_SCANS_VIEW_SAMPLE_LABEL,
} from "@/lib/advisory-copy";
import { buildAdvisoryScanSummary } from "@/lib/advisory-scan-summary";
import { getImprovementPlan } from "@/lib/api";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { isExperimentalAdvisoryPanelsEnabled } from "@/lib/feature-flags";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import {
  ARCHLUCID_OPERATOR_SCOPE_CHANGED_EVENT,
  readOperatorScopeFromStorage,
} from "@/lib/operator/operator-scope-storage";
import type { WhyDisabledCtaReason } from "@/lib/why-disabled-cta";
import type { ImprovementPlan, RecommendationRecord } from "@/types/advisory";

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

function formatAdvisoryScansLastLoaded(lastLoadedUtc: string | null): string {
  if (lastLoadedUtc === null) {
    return " — ";
  }

  const parsed = new Date(lastLoadedUtc);

  if (Number.isNaN(parsed.getTime())) {
    return " — ";
  }

  return parsed.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

/**
 * Scans tab: governance follow-up workspace for advisory recommendations.
 */
export function AdvisoryScansContent(props: AdvisoryScansContentProps = {}): React.JSX.Element {
  const callerAuthorityRank = useNavCallerAuthorityRank();
  const isAdminCaller = callerAuthorityRank >= AUTHORITY_RANK.AdminAuthority;
  const bootstrappedRunId = (props.initialRunId ?? "").trim();
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

    setRecommendations(bootstrapRecommendationsQuery.data);
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

      return queryClient.fetchQuery({
        queryKey,
        queryFn: () => listRecommendations(rid),
        staleTime: 0,
      });
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
        await applyRecommendationAction(
          pendingDisposition.recommendationId,
          pendingDisposition.action,
          comment,
          rationale,
        );
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

  const lastLoadedLabel = formatAdvisoryScansLastLoaded(lastLoadedUtc);

  const listHeader = (
    <div
      className="flex flex-wrap items-start justify-between gap-2"
      data-testid="advisory-scans-list-header"
    >
      <div className="min-w-0 space-y-1">
        <h3 className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
          {ADVISORY_SCANS_LIST_HEADING}
        </h3>
        <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          <span className="font-medium text-al-text-primary">Project scope:</span> {projectLabel}
          <span aria-hidden="true"> · </span>
          <span data-testid="advisory-scans-count">
            {recommendations.length} {ADVISORY_SCANS_LIST_COUNT_LABEL}
          </span>
          <span aria-hidden="true"> · </span>
          <span data-testid="advisory-scans-last-loaded">
            {ADVISORY_SCANS_LAST_LOADED_PREFIX}: {lastLoadedLabel}
          </span>
        </p>
      </div>
      <RefreshButton
        busy={loading}
        data-testid="advisory-scans-refresh"
        onClick={() => {
          void refreshPersistedOnly();
        }}
      />
    </div>
  );

  return (
    <OperatorPageContainer variant="workflow" data-testid="advisory-scans-content">
      {listHeader}

      <section
        className={cn(DESIGN_TOKENS.surface.card, "mb-6 mt-4 space-y-4 p-5")}
        aria-label={ADVISORY_SCANS_FORM_SECTION_TITLE}
        data-testid="advisory-scan-form"
      >
        <div className="space-y-1">
          <h3 className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
            {ADVISORY_SCANS_FORM_SECTION_TITLE}
          </h3>
        </div>

        {bootstrappedRunId.length > 0 ? (
          <p
            className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
            data-testid="advisory-scans-run-scope-banner"
          >
            Scoped to review <span className="font-mono text-al-text-primary">{bootstrappedRunId}</span>.
            Persisted recommendations load automatically; generate a scan if you need a fresh plan.
          </p>
        ) : null}

        <div className="grid gap-4">
          <RunIdPicker
            label={ADVISORY_SCANS_FINALIZED_REVIEW_LABEL}
            placeholder={ADVISORY_SCANS_FINALIZED_REVIEW_PLACEHOLDER}
            value={runId}
            onChange={setRunId}
            inputId="advisory-run-id"
            committedOnly
            preferAutoPick={false}
            useBuyerFacingRunLabels
          />

          <div className="space-y-2">
            <RunIdPicker
              label={ADVISORY_SCANS_BASELINE_REVIEW_LABEL}
              placeholder={ADVISORY_SCANS_BASELINE_REVIEW_PLACEHOLDER}
              value={compareToRunId}
              onChange={setCompareToRunId}
              inputId="advisory-compare-run-id"
              committedOnly
              preferAutoPick={false}
              useBuyerFacingRunLabels
            />
            <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              {ADVISORY_SCANS_BASELINE_REVIEW_HELPER}
            </p>
          </div>

          <details
            className={cn(
              "rounded-md border border-neutral-200 bg-neutral-50/80 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900/40",
              OPERATOR_TYPOGRAPHY.helper,
            )}
          >
            <summary className="cursor-pointer font-medium text-neutral-800 dark:text-neutral-200">
              {ADVISORY_SCANS_CANT_FIND_REVIEW_SUMMARY}
            </summary>
            <div className="mt-3 space-y-3">
              <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
                {ADVISORY_SCANS_CANT_FIND_REVIEW_BODY}
              </p>
              <Button asChild size="sm" variant="outline">
                <Link href={ADVISORY_SCANS_OPEN_REVIEW_PACKAGES_HREF}>{ADVISORY_SCANS_OPEN_REVIEW_PACKAGES_LABEL}</Link>
              </Button>

              {isAdminCaller ? (
                <details className="rounded border border-dashed border-neutral-300 p-3 dark:border-neutral-600">
                  <summary className="cursor-pointer font-medium text-neutral-800 dark:text-neutral-200">
                    {ADVISORY_SCANS_MANUAL_ID_ADMIN_SUMMARY}
                  </summary>
                  <div className="mt-3 grid gap-2">
                    <input
                      value={runId}
                      onChange={(event) => {
                        setRunId(event.target.value);
                      }}
                      placeholder={ADVISORY_SCANS_MANUAL_ID_TARGET_PLACEHOLDER}
                      className={cn(
                        "rounded-md border border-neutral-300 bg-white p-2 font-mono text-neutral-900 dark:border-neutral-600 dark:bg-neutral-950 dark:text-neutral-100",
                        OPERATOR_TYPOGRAPHY.body,
                      )}
                    />
                    <input
                      value={compareToRunId}
                      onChange={(event) => {
                        setCompareToRunId(event.target.value);
                      }}
                      placeholder={ADVISORY_SCANS_MANUAL_ID_BASELINE_PLACEHOLDER}
                      className={cn(
                        "rounded-md border border-neutral-300 bg-white p-2 font-mono text-neutral-900 dark:border-neutral-600 dark:bg-neutral-950 dark:text-neutral-100",
                        OPERATOR_TYPOGRAPHY.body,
                      )}
                    />
                  </div>
                </details>
              ) : null}
            </div>
          </details>
        </div>

        <div className="space-y-2">
          <p
            className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
            data-testid="advisory-scans-inline-boundary"
          >
            {ADVISORY_SCANS_INLINE_CAPABILITY_BOUNDARY}
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant={reviewSelected ? "primary" : "outline"}
              onClick={() => {
                void loadAdvice();
              }}
              disabled={loading || !reviewSelected}
              aria-describedby={generateDisabledReason === null ? undefined : generateDisabledHintId}
              data-testid="advisory-generate-scan-button"
            >
              {loading ? ADVISORY_SCANS_GENERATE_BUTTON_WORKING_LABEL : ADVISORY_SCANS_GENERATE_BUTTON_LABEL}
            </Button>

            {reviewSelected ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  void refreshPersistedOnly();
                }}
                disabled={loading}
              >
                {ADVISORY_SCANS_REFRESH_SAVED_LABEL}
              </Button>
            ) : null}

            <WhyDisabledCtaHint
              id={generateDisabledHintId}
              reason={generateDisabledReason}
              testId="advisory-generate-disabled-hint"
            />
          </div>

          {reviewSelected ? (
            <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
              {ADVISORY_SCANS_GENERATE_OUTPUT_HINT}
            </p>
          ) : null}
        </div>
      </section>

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
