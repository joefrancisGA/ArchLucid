"use client";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

import { useState } from "react";

import { DocumentLayout } from "@/components/DocumentLayout";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { RunIdPicker } from "@/components/RunIdPicker";
import { Button } from "@/components/ui/button";
import { getImprovementPlan } from "@/lib/api";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { applyRecommendationAction, listRecommendations } from "@/lib/advisory-api";
import { isExperimentalAdvisoryPanelsEnabled } from "@/lib/feature-flags";
import type { ImprovementPlan, RecommendationRecord } from "@/types/advisory";

/**
 * Scans tab: improvement advisor (former standalone `/advisory` page body).
 */
export function AdvisoryScansContent() {
  const [runId, setRunId] = useState("");
  const [compareToRunId, setCompareToRunId] = useState("");
  const [planSummary, setPlanSummary] = useState<ImprovementPlan | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [failure, setFailure] = useState<ApiLoadFailureState | null>(null);

  async function takeAction(recommendationId: string, action: string) {
    const comment = window.prompt(`Optional comment for ${action}:`) ?? "";
    const rationale = window.prompt(`Optional rationale for ${action}:`) ?? "";

    setFailure(null);
    try {
      await applyRecommendationAction(recommendationId, action, comment, rationale);
      const rid = runId.trim();

      if (rid) {
        const refreshed = await listRecommendations(rid);
        setRecommendations(refreshed);
      }
    } catch (e) {
      setFailure(toApiLoadFailure(e));
    }
  }

  async function loadAdvice() {
    const rid = runId.trim();

    if (!rid) {
      return;
    }

    setLoading(true);
    setFailure(null);
    try {
      const data = await getImprovementPlan(rid, compareToRunId.trim() || undefined);
      setPlanSummary(data);
      const persisted = await listRecommendations(rid);
      setRecommendations(persisted);
    } catch (e) {
      setFailure(toApiLoadFailure(e));
      setPlanSummary(null);
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  }

  async function refreshPersistedOnly() {
    const rid = runId.trim();

    if (!rid) {
      return;
    }

    setLoading(true);
    setFailure(null);
    try {
      const persisted = await listRecommendations(rid);
      setRecommendations(persisted);
    } catch (e) {
      setFailure(toApiLoadFailure(e));
    } finally {
      setLoading(false);
    }
  }

  const hasResults = planSummary !== null || recommendations.length > 0;
  const reviewSelected = runId.trim().length > 0;

  return (
    <div className="w-full max-w-[1200px] px-4 py-6">
      <DocumentLayout>
        <div className="m-0 mb-1 flex flex-wrap items-center gap-2">
          <h2 className={cn("m-0 font-bold text-neutral-900 dark:text-neutral-50", OPERATOR_TYPOGRAPHY.pageTitle)}>Architecture advisory</h2>
        </div>
        <p className="doc-meta m-0">
          Generate prioritized recommendations from a finalized review package: changes, risks, tradeoffs, and follow-up
          actions. Recommendations can be <strong>accepted</strong>, <strong>deferred</strong>,{" "}
          <strong>rejected</strong>, or <strong>marked implemented</strong> to feed the governance workflow. Optionally
          compare against an earlier review for delta signals.
        </p>

        <div className="mb-6 grid gap-3">
          <RunIdPicker
            label="Review package"
            placeholder="Choose a finalized review package"
            value={runId}
            onChange={setRunId}
            inputId="advisory-run-id"
            committedOnly
            preferAutoPick={false}
          />
          <RunIdPicker
            label="Compare against earlier review (optional)"
            placeholder="Choose baseline review for delta signals"
            value={compareToRunId}
            onChange={setCompareToRunId}
            inputId="advisory-compare-run-id"
            committedOnly
            preferAutoPick={false}
          />

          <details className={cn("rounded-md border border-neutral-200 bg-neutral-50/80 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900/40", OPERATOR_TYPOGRAPHY.helper)}>
            <summary className="cursor-pointer font-medium text-neutral-800 dark:text-neutral-200">
              Advanced: enter review ID manually
            </summary>
            <div className="mt-3 grid gap-2">
              <input
                value={runId}
                onChange={(e) => setRunId(e.target.value)}
                placeholder="Architecture review ID (target / current review)"
                className={cn("rounded-md border border-neutral-300 bg-white p-2 font-mono text-neutral-900 dark:border-neutral-600 dark:bg-neutral-950 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}
              />
              <input
                value={compareToRunId}
                onChange={(e) => setCompareToRunId(e.target.value)}
                placeholder="Optional compare-to architecture review ID"
                className={cn("rounded-md border border-neutral-300 bg-white p-2 font-mono text-neutral-900 dark:border-neutral-600 dark:bg-neutral-950 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}
              />
            </div>
          </details>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              className="bg-teal-600 text-white hover:bg-teal-700"
              onClick={() => void loadAdvice()}
              disabled={loading || !reviewSelected}
              title={!reviewSelected ? "Select a finalized review package first." : undefined}
            >
              {loading ? "Working…" : "Generate recommendations"}
            </Button>

            {reviewSelected ? (
              <Button type="button" variant="outline" onClick={() => void refreshPersistedOnly()} disabled={loading}>
                Refresh saved list
              </Button>
            ) : null}
          </div>

          {!reviewSelected ? (
            <p className={cn("m-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
              Select a finalized review package first.
            </p>
          ) : null}
        </div>

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
              <code className={cn("rounded bg-neutral-200 px-1 dark:bg-neutral-800", OPERATOR_TYPOGRAPHY.helper)}>NEXT_PUBLIC_EXPERIMENTAL_ADVISORY_PANELS=true</code>{" "}
              at build time.
            </p>
          </section>
        ) : null}

        {!hasResults ? (
          <section
            className="rounded-md border border-neutral-200 bg-al-surface-raised dark:border-neutral-800 p-4"
            aria-label="No advisory scan selected"
          >
            <p className={cn("m-0 font-medium text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
              No advisory scan selected — choose a review package to generate recommendations.
            </p>

            <h3 className={cn("mt-4 mb-2 font-semibold uppercase tracking-wide text-teal-900 dark:text-teal-200", OPERATOR_TYPOGRAPHY.body)}>
              Example recommendation
            </h3>
            <div className={cn("rounded border border-neutral-200 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-950", OPERATOR_TYPOGRAPHY.body)}>
              <p className={cn("m-0 font-medium text-amber-800 dark:text-amber-200", OPERATOR_TYPOGRAPHY.helper)}>High impact</p>
              <p className="m-0 mt-1 font-semibold text-neutral-900 dark:text-neutral-100">
                API tier lacks a circuit breaker around legacy claims service
              </p>
              <p className="m-0 mt-2 text-neutral-700 dark:text-neutral-300">
                Under load, repeated timeouts could cascade. Harden the integration and add a documented fallback path
                before the next production promotion.
              </p>
              <p className="m-0 mt-2 text-neutral-600 dark:text-neutral-400">
                <strong className="font-medium text-neutral-800 dark:text-neutral-200">Suggested action:</strong> Add
                timeout + bulkhead; capture health metrics for the dependency.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className={cn("rounded border border-neutral-200 px-2 py-0.5 text-neutral-500 dark:border-neutral-700", OPERATOR_TYPOGRAPHY.helper)}>Accept</span>
                <span className={cn("rounded border border-neutral-200 px-2 py-0.5 text-neutral-500 dark:border-neutral-700", OPERATOR_TYPOGRAPHY.helper)}>Defer</span>
                <span className={cn("rounded border border-neutral-200 px-2 py-0.5 text-neutral-500 dark:border-neutral-700", OPERATOR_TYPOGRAPHY.helper)}>Reject</span>
                <span className={cn("rounded border border-neutral-200 px-2 py-0.5 text-neutral-500 dark:border-neutral-700", OPERATOR_TYPOGRAPHY.helper)}>Mark implemented</span>
              </div>
            </div>
          </section>
        ) : null}

        {planSummary ? (
          <>
            <h3 className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>Summary</h3>
            <ul className={cn("m-0 list-disc space-y-1 pl-5 leading-relaxed", OPERATOR_TYPOGRAPHY.body)}>
              {planSummary.summaryNotes.map((note, index) => (
                <li key={index}>{note}</li>
              ))}
            </ul>
          </>
        ) : null}

        {recommendations.length > 0 ? (
          <>
            <h3 className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>Recommendations</h3>
            <p className={cn("doc-meta m-0", OPERATOR_TYPOGRAPHY.body)}>
              Accept, defer, reject, or mark recommendations as implemented to record governance disposition.
            </p>
            <div className="grid gap-4">
              {recommendations.map((rec) => (
                <div
                  key={rec.recommendationId}
                  className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-950"
                >
                  <h4 className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>{rec.title}</h4>
                  <p className={cn("m-0 mt-2 leading-relaxed", OPERATOR_TYPOGRAPHY.body)}>
                    <strong>Status:</strong> {rec.status}
                  </p>
                  <p className={cn("m-0 mt-2 leading-relaxed", OPERATOR_TYPOGRAPHY.body)}>
                    <strong>Category:</strong> {rec.category}
                  </p>
                  <p className={cn("m-0 mt-2 leading-relaxed", OPERATOR_TYPOGRAPHY.body)}>
                    <strong>Urgency:</strong> {rec.urgency}
                  </p>
                  <p className={cn("m-0 mt-2 leading-relaxed", OPERATOR_TYPOGRAPHY.body)}>
                    <strong>Priority score:</strong> {rec.priorityScore}
                  </p>
                  <p className={cn("m-0 mt-2 leading-relaxed", OPERATOR_TYPOGRAPHY.body)}>
                    <strong>Rationale:</strong> {rec.rationale}
                  </p>
                  <p className={cn("m-0 mt-2 leading-relaxed", OPERATOR_TYPOGRAPHY.body)}>
                    <strong>Suggested action:</strong> {rec.suggestedAction}
                  </p>
                  <p className={cn("m-0 mt-2 leading-relaxed", OPERATOR_TYPOGRAPHY.body)}>
                    <strong>Expected impact:</strong> {rec.expectedImpact}
                  </p>
                  {rec.reviewedByUserName ? (
                    <p className={cn("m-0 mt-2 leading-relaxed", OPERATOR_TYPOGRAPHY.body)}>
                      <strong>Last reviewed by:</strong> {rec.reviewedByUserName}
                    </p>
                  ) : null}
                  {rec.reviewComment ? (
                    <p className={cn("m-0 mt-2 leading-relaxed", OPERATOR_TYPOGRAPHY.body)}>
                      <strong>Review comment:</strong> {rec.reviewComment}
                    </p>
                  ) : null}
                  {rec.resolutionRationale ? (
                    <p className={cn("m-0 mt-2 leading-relaxed", OPERATOR_TYPOGRAPHY.body)}>
                      <strong>Resolution rationale:</strong> {rec.resolutionRationale}
                    </p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={() => void takeAction(rec.recommendationId, "Accept")}>
                      Accept
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => void takeAction(rec.recommendationId, "Reject")}>
                      Reject
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => void takeAction(rec.recommendationId, "Defer")}>
                      Defer
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => void takeAction(rec.recommendationId, "MarkImplemented")}>
                      Mark implemented
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : planSummary && recommendations.length === 0 ? (
          <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>No persisted recommendations returned for this architecture review.</p>
        ) : null}
      </DocumentLayout>
    </div>
  );
}
