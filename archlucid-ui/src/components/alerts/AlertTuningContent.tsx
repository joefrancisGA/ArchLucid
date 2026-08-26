"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { AlertTuningCandidateCard } from "@/components/alerts/AlertTuningCandidateCard";
import { AlertTuningForm } from "@/components/alerts/AlertTuningForm";
import { AlertTuningPickReviewBeforeTuningStrip } from "@/components/alerts/AlertTuningPickReviewBeforeTuningStrip";
import { AlertTuningNextReviewFooterClient } from "@/components/alerts/AlertTuningNextReviewFooterClient";
import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { useOperateCapability } from "@/hooks/use-operate-capability";
import { recommendAlertThreshold } from "@/lib/api";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure, uiFailureFromMessage } from "@/lib/api-load-failure";
import { resolveAlertSimulationRunProjectSlug } from "@/lib/alert-simulation-form";
import {
  resolveAlertTuningRecommendEmphasizedStepId,
  resolveAlertTuningRecommendSteps,
} from "@/lib/alert-tuning-recommend-checklist";
import {
  alertToolingChangeConfigurationHeadingOperator,
  alertToolingConfigureSectionSubline,
  alertTuningCurrentTuningHeadingOperator,
  alertTuningCurrentTuningHeadingReader,
} from "@/lib/enterprise-controls-context-copy";
import { OPERATOR_BODY_INLINE_LINK_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  GOVERNANCE_ALERT_RULES_PATH,
  governanceAlertRulesTabHref,
} from "@/lib/governance/governance-route-paths";
import { readOperatorScopeFromStorage } from "@/lib/operator/operator-scope-storage";
import type { ThresholdRecommendationResult } from "@/types/alert-tuning";

export function AlertTuningContent() {
  const canMutateEnterpriseShell = useOperateCapability();
  const router = useRouter();
  const searchParams = useSearchParams();
  const scopedRunId = (searchParams.get("runId") ?? "").trim();
  const scopedRunFilterActive = scopedRunId.length > 0;
  const [ruleKind, setRuleKind] = useState<"Simple" | "Composite">("Simple");
  const [ruleType, setRuleType] = useState("CostIncreasePercent");
  const [tunedMetricComposite, setTunedMetricComposite] = useState("CostIncreasePercent");
  const [severity, setSeverity] = useState("Warning");
  const [name, setName] = useState("Tuning candidate");
  const [candidateThresholdsStr, setCandidateThresholdsStr] = useState("5,10,15,20,25");
  const [recentRunCount, setRecentRunCount] = useState(10);
  const [targetMin, setTargetMin] = useState(1);
  const [targetMax, setTargetMax] = useState(5);
  const [runSlug, setRunSlug] = useState("");

  const [cJoin, setCJoin] = useState("And");
  const [cSuppression, setCSuppression] = useState(1440);
  const [cCooldown, setCCooldown] = useState(60);
  const [cDedupe, setCDedupe] = useState("RuleAndRun");
  const [cM1, setCM1] = useState("CostIncreasePercent");
  const [cO1, setCO1] = useState("GreaterThanOrEqual");
  const [cV1, setCV1] = useState(10);
  const [cM2, setCM2] = useState("NewComplianceGapCount");
  const [cO2, setCO2] = useState("GreaterThanOrEqual");
  const [cV2, setCV2] = useState(1);

  const [loading, setLoading] = useState(false);
  const [failure, setFailure] = useState<ApiLoadFailureState | null>(null);
  const [result, setResult] = useState<ThresholdRecommendationResult | null>(null);

  const onPickReview = useCallback(
    (reviewId: string) => {
      const trimmed = reviewId.trim();

      if (trimmed.length === 0) {
        return;
      }

      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", "test-alerts");
      params.set("runId", trimmed);

      router.replace(`${GOVERNANCE_ALERT_RULES_PATH}?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  async function recommend() {
    setFailure(null);
    setResult(null);
    const thresholds = candidateThresholdsStr
      .split(",")
      .map((x) => Number(x.trim()))
      .filter((x) => !Number.isNaN(x));

    if (thresholds.length === 0) {
      setFailure(uiFailureFromMessage("Enter at least one numeric candidate threshold (comma-separated)."));
      return;
    }

    const first = thresholds[0]!;

    setLoading(true);
    try {
      if (ruleKind === "Simple") {
        const data = await recommendAlertThreshold({
          ruleKind: "Simple",
          tunedMetricType: ruleType,
          candidateThresholds: thresholds,
          recentRunCount,
          targetCreatedAlertCountMin: targetMin,
          targetCreatedAlertCountMax: targetMax,
          runProjectSlug: resolveAlertSimulationRunProjectSlug(
            runSlug,
            readOperatorScopeFromStorage()?.projectId,
          ),
          baseSimpleRule: {
            ruleId: "00000000-0000-0000-0000-000000000000",
            tenantId: "00000000-0000-0000-0000-000000000000",
            workspaceId: "00000000-0000-0000-0000-000000000000",
            projectId: "00000000-0000-0000-0000-000000000000",
            name: name.trim() || "Candidate rule",
            ruleType,
            severity,
            thresholdValue: first,
            isEnabled: true,
            targetChannelType: "DigestOnly",
            metadataJson: "{}",
            createdUtc: new Date().toISOString(),
          },
        });
        setResult(data);
      } else {
        if (cM1 !== tunedMetricComposite && cM2 !== tunedMetricComposite) {
          setFailure(
            uiFailureFromMessage('Set "Metric to tune" to match condition 1 or condition 2 metric.'),
          );
          setLoading(false);
          return;
        }
        const data = await recommendAlertThreshold({
          ruleKind: "Composite",
          tunedMetricType: tunedMetricComposite,
          candidateThresholds: thresholds,
          recentRunCount,
          targetCreatedAlertCountMin: targetMin,
          targetCreatedAlertCountMax: targetMax,
          runProjectSlug: resolveAlertSimulationRunProjectSlug(
            runSlug,
            readOperatorScopeFromStorage()?.projectId,
          ),
          baseCompositeRule: {
            compositeRuleId: "00000000-0000-0000-0000-000000000000",
            tenantId: "00000000-0000-0000-0000-000000000000",
            workspaceId: "00000000-0000-0000-0000-000000000000",
            projectId: "00000000-0000-0000-0000-000000000000",
            name: name.trim() || "Composite tuning",
            severity,
            operator: cJoin,
            isEnabled: true,
            suppressionWindowMinutes: cSuppression,
            cooldownMinutes: cCooldown,
            reopenDeltaThreshold: 0,
            dedupeScope: cDedupe,
            targetChannelType: "AlertRouting",
            createdUtc: new Date().toISOString(),
            conditions: [
              { metricType: cM1, operator: cO1, thresholdValue: cV1 },
              { metricType: cM2, operator: cO2, thresholdValue: cV2 },
            ],
          },
        });
        setResult(data);
      }
    } catch (e) {
      setFailure(toApiLoadFailure(e));
    } finally {
      setLoading(false);
    }
  }

  const recommendedLabel = result?.recommendedCandidate?.candidate.label;
  const signalChosen =
    ruleKind === "Simple" ? ruleType.trim().length > 0 : tunedMetricComposite.trim().length > 0;
  const windowSet =
    (Number.isFinite(recentRunCount) && recentRunCount >= 1) || runSlug.trim().length > 0;
  const recommendComplete = result !== null;
  const recommendChecklistInput = {
    signalChosen,
    windowSet,
    recommendComplete,
  };
  const recommendSteps = resolveAlertTuningRecommendSteps(recommendChecklistInput);
  const recommendEmphasizedStepId =
    resolveAlertTuningRecommendEmphasizedStepId(recommendChecklistInput);

  return (
    <div>
      {failure !== null ? (
        <div role="alert">
          <OperatorApiProblem
            problem={failure.problem}
            fallbackMessage={failure.message}
            correlationId={failure.correlationId}
          />
        </div>
      ) : null}

      {!scopedRunFilterActive ? (
        <AlertTuningPickReviewBeforeTuningStrip selectedReviewId="" onSelectReview={onPickReview} />
      ) : (
        <p
          className={cn("m-0 mb-4 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
          data-testid="alert-tuning-run-scope-banner"
        >
          {"Tuning thresholds for review "}
          <span className="font-mono text-al-text-primary">{scopedRunId}</span>
          {" · "}
          <Link className={OPERATOR_BODY_INLINE_LINK_CLASS} href={governanceAlertRulesTabHref("test-alerts")}>
            Clear review scope
          </Link>
          {" · "}
          <Link
            className={OPERATOR_BODY_INLINE_LINK_CLASS}
            href={`/architecture/reviews/${encodeURIComponent(scopedRunId)}`}
          >
            Open review
          </Link>
        </p>
      )}

      <div className="flex flex-col gap-10">
        <section className="min-w-0" aria-labelledby="alert-tuning-current-heading">
          <h3 id="alert-tuning-current-heading" className={cn("mb-2 mt-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>
            {canMutateEnterpriseShell
              ? alertTuningCurrentTuningHeadingOperator
              : alertTuningCurrentTuningHeadingReader}
          </h3>
          {result ? (
            <>
              <h4 className={cn("mb-2 mt-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>Summary</h4>
              <ul>
                {result.summaryNotes.map((note, index) => (
                  <li key={index}>{note}</li>
                ))}
              </ul>

              {result.recommendedCandidate ? (
                <section className="mb-6 mt-4">
                  <h4 className={cn("mb-2 mt-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>Recommended candidate</h4>
                  <AlertTuningCandidateCard evaluation={result.recommendedCandidate} highlight />
                </section>
              ) : null}

              <h4 className={cn("mb-2 mt-2", OPERATOR_TYPOGRAPHY.sectionTitle)}>
                All candidates (highest overall ranking first)
              </h4>
              <div className="grid gap-3">
                {[...result.candidates]
                  .sort((a, b) => b.scoreBreakdown.finalScore - a.scoreBreakdown.finalScore)
                  .map((c, i) => (
                    <AlertTuningCandidateCard
                      key={`${c.candidate.thresholdValue}-${i}`}
                      evaluation={c}
                      highlight={c.candidate.label === recommendedLabel}
                    />
                  ))}
              </div>
            </>
          ) : (
            <p className={cn("mt-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
              No tuning results yet. Run a recommendation below to compare candidate thresholds against recent reviews.
            </p>
          )}
        </section>

        {scopedRunFilterActive ? (
        <section className="min-w-0" aria-labelledby="alert-tuning-change-heading">
          <h3 id="alert-tuning-change-heading" className={cn("mb-2 mt-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>
            {alertToolingChangeConfigurationHeadingOperator}
          </h3>
          <p className={cn("mb-2.5 mt-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
            {alertToolingConfigureSectionSubline}
          </p>
          <AlertTuningForm
            ruleKind={ruleKind}
            setRuleKind={setRuleKind}
            ruleType={ruleType}
            setRuleType={setRuleType}
            tunedMetricComposite={tunedMetricComposite}
            setTunedMetricComposite={setTunedMetricComposite}
            severity={severity}
            setSeverity={setSeverity}
            name={name}
            setName={setName}
            candidateThresholdsStr={candidateThresholdsStr}
            setCandidateThresholdsStr={setCandidateThresholdsStr}
            recentRunCount={recentRunCount}
            setRecentRunCount={setRecentRunCount}
            targetMin={targetMin}
            setTargetMin={setTargetMin}
            targetMax={targetMax}
            setTargetMax={setTargetMax}
            runSlug={runSlug}
            setRunSlug={setRunSlug}
            cJoin={cJoin}
            setCJoin={setCJoin}
            cSuppression={cSuppression}
            setCSuppression={setCSuppression}
            cCooldown={cCooldown}
            setCCooldown={setCCooldown}
            cDedupe={cDedupe}
            setCDedupe={setCDedupe}
            cM1={cM1}
            setCM1={setCM1}
            cO1={cO1}
            setCO1={setCO1}
            cV1={cV1}
            setCV1={setCV1}
            cM2={cM2}
            setCM2={setCM2}
            cO2={cO2}
            setCO2={setCO2}
            cV2={cV2}
            setCV2={setCV2}
            loading={loading}
            recommendSteps={recommendSteps}
            recommendEmphasizedStepId={recommendEmphasizedStepId}
            onRecommend={recommend}
          />
        </section>
        ) : null}
      </div>

      {scopedRunFilterActive ? <AlertTuningNextReviewFooterClient runId={scopedRunId} /> : null}
    </div>
  );
}
