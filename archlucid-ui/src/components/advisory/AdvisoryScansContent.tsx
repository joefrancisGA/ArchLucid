"use client";

import { cn } from "@/lib/utils";

import Link from "next/link";
import { useCallback, useMemo, useRef, useState } from "react";

import { AdvisoryRecommendationCard } from "@/components/advisory/AdvisoryRecommendationCard";
import { AdvisorySampleRecommendationPreview } from "@/components/advisory/AdvisorySampleRecommendationPreview";
import { AdvisoryScanSummaryPanel } from "@/components/advisory/AdvisoryScanSummaryPanel";
import { DocumentLayout } from "@/components/DocumentLayout";
import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { useNavCallerAuthorityRank } from "@/components/OperatorNavAuthorityProvider";
import { RunIdPicker } from "@/components/RunIdPicker";
import { Button } from "@/components/ui/button";
import { applyRecommendationAction, listRecommendations } from "@/lib/advisory-api";
import {
  ADVISORY_SCANS_BASELINE_REVIEW_HELPER,
  ADVISORY_SCANS_BASELINE_REVIEW_LABEL,
  ADVISORY_SCANS_BASELINE_REVIEW_PLACEHOLDER,
  ADVISORY_SCANS_CANT_FIND_REVIEW_BODY,
  ADVISORY_SCANS_CANT_FIND_REVIEW_SUMMARY,
  ADVISORY_SCANS_EMPTY_BODY,
  ADVISORY_SCANS_EMPTY_TITLE,
  ADVISORY_SCANS_FINALIZED_REVIEW_LABEL,
  ADVISORY_SCANS_FINALIZED_REVIEW_PLACEHOLDER,
  ADVISORY_SCANS_FORM_SECTION_TITLE,
  ADVISORY_SCANS_GENERATE_BUTTON_LABEL,
  ADVISORY_SCANS_GENERATE_BUTTON_WORKING_LABEL,
  ADVISORY_SCANS_GENERATE_DISABLED_HINT,
  ADVISORY_SCANS_GENERATE_OUTPUT_HINT,
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
import type { ImprovementPlan, RecommendationRecord } from "@/types/advisory";

/**
 * Scans tab: governance follow-up workspace for advisory recommendations.
 */
export function AdvisoryScansContent(): React.JSX.Element {
  const callerAuthorityRank = useNavCallerAuthorityRank();
  const isAdminCaller = callerAuthorityRank >= AUTHORITY_RANK.AdminAuthority;
  const sampleSectionRef = useRef<HTMLDivElement | null>(null);

  const [runId, setRunId] = useState("");
  const [compareToRunId, setCompareToRunId] = useState("");
  const [planSummary, setPlanSummary] = useState<ImprovementPlan | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [failure, setFailure] = useState<ApiLoadFailureState | null>(null);

  const reviewSelected = runId.trim().length > 0;
  const hasResults = planSummary !== null || recommendations.length > 0;

  const scanSummary = useMemo(
    () => buildAdvisoryScanSummary(recommendations, planSummary, compareToRunId),
    [compareToRunId, planSummary, recommendations],
  );

  const takeAction = useCallback(
    async (recommendationId: string, action: string) => {
      const comment = window.prompt(`Optional comment for ${action}:`) ?? "";
      const rationale = window.prompt(`Optional rationale for ${action}:`) ?? "";

      setFailure(null);

      try {
        await applyRecommendationAction(recommendationId, action, comment, rationale);
        const rid = runId.trim();

        if (rid.length > 0) {
          const refreshed = await listRecommendations(rid);
          setRecommendations(refreshed);
        }
      } catch (error) {
        setFailure(toApiLoadFailure(error));
      }
    },
    [runId],
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
      const persisted = await listRecommendations(rid);
      setRecommendations(persisted);
    } catch (error) {
      setFailure(toApiLoadFailure(error));
      setPlanSummary(null);
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  }, [compareToRunId, runId]);

  const refreshPersistedOnly = useCallback(async () => {
    const rid = runId.trim();

    if (rid.length === 0) {
      return;
    }

    setLoading(true);
    setFailure(null);

    try {
      const persisted = await listRecommendations(rid);
      setRecommendations(persisted);
    } catch (error) {
      setFailure(toApiLoadFailure(error));
    } finally {
      setLoading(false);
    }
  }, [runId]);

  const scrollToSample = useCallback(() => {
    sampleSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <div className="w-full max-w-[1200px] px-4 py-6">
      <DocumentLayout>
        <section
          className={cn(DESIGN_TOKENS.surface.card, "mb-6 space-y-4 p-5")}
          aria-label={ADVISORY_SCANS_FORM_SECTION_TITLE}
          data-testid="advisory-scan-form"
        >
          <div className="space-y-1">
            <h2 className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
              {ADVISORY_SCANS_FORM_SECTION_TITLE}
            </h2>
          </div>

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
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                className="bg-teal-600 text-white hover:bg-teal-700"
                onClick={() => {
                  void loadAdvice();
                }}
                disabled={loading || !reviewSelected}
                title={!reviewSelected ? ADVISORY_SCANS_GENERATE_DISABLED_HINT : undefined}
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
            </div>

            {!reviewSelected ? (
              <p
                className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}
                data-testid="advisory-generate-disabled-hint"
              >
                {ADVISORY_SCANS_GENERATE_DISABLED_HINT}
              </p>
            ) : (
              <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
                {ADVISORY_SCANS_GENERATE_OUTPUT_HINT}
              </p>
            )}
          </div>
        </section>

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
                    void takeAction(recommendationId, action);
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

        {!hasResults ? (
          <div className="space-y-4">
            <EnterpriseCompactEmptyState
              testId="advisory-scan-empty-state"
              title={ADVISORY_SCANS_EMPTY_TITLE}
              description={ADVISORY_SCANS_EMPTY_BODY}
              actions={[
                {
                  label: ADVISORY_SCANS_OPEN_REVIEW_PACKAGES_LABEL,
                  href: ADVISORY_SCANS_OPEN_REVIEW_PACKAGES_HREF,
                  variant: "primary",
                },
              ]}
              footer={
                <Button type="button" size="sm" variant="outline" onClick={scrollToSample}>
                  {ADVISORY_SCANS_VIEW_SAMPLE_LABEL}
                </Button>
              }
            />

            <div ref={sampleSectionRef}>
              <AdvisorySampleRecommendationPreview />
            </div>
          </div>
        ) : null}
      </DocumentLayout>
    </div>
  );
}
