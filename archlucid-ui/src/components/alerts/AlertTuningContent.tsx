"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";
import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { FieldHelpTooltip } from "@/components/FieldHelpTooltip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useOperateCapability } from "@/hooks/use-operate-capability";
import { recommendAlertThreshold } from "@/lib/api";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure, uiFailureFromMessage } from "@/lib/api-load-failure";
import {
  ALERT_SIMULATION_PROJECT_SLUG_HELPER,
  ALERT_SIMULATION_PROJECT_SLUG_PLACEHOLDER,
  ALERT_TOOLING_FORM_SELECT_CLASS,
  resolveAlertSimulationRunProjectSlug,
} from "@/lib/alert-simulation-form";
import {
  ALERT_TUNING_RANKING_FACTORS_HEADING,
  formatAlertTuningScoreAxisLines,
} from "@/lib/alert-tuning-score-labels";
import {
  alertToolingChangeConfigurationHeadingOperator,
  alertToolingConfigureSectionSubline,
  alertTuningCurrentTuningHeadingOperator,
  alertTuningCurrentTuningHeadingReader,
  alertTuningRecommendButtonTitle,
} from "@/lib/enterprise-controls-context-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { readOperatorScopeFromStorage } from "@/lib/operator/operator-scope-storage";
import type { ThresholdCandidateEvaluation, ThresholdRecommendationResult } from "@/types/alert-tuning";

const SIMPLE_RULE_TYPES = [
  { value: "CriticalRecommendationCount", label: "Critical / high recommendation count" },
  { value: "NewComplianceGapCount", label: "New compliance gap count" },
  { value: "CostIncreasePercent", label: "Cost increase %" },
  { value: "DeferredHighPriorityRecommendationAgeDays", label: "Deferred high-priority age (days)" },
  { value: "RejectedSecurityRecommendation", label: "Rejected security recommendation" },
  { value: "AcceptanceRateDrop", label: "Acceptance rate below %" },
];

const COMPOSITE_METRICS = [
  { value: "CriticalRecommendationCount", label: "Critical/high recommendation count" },
  { value: "NewComplianceGapCount", label: "New compliance gap count" },
  { value: "CostIncreasePercent", label: "Cost increase %" },
  { value: "DeferredHighPriorityRecommendationCount", label: "Deferred high-priority count" },
  { value: "RejectedSecurityRecommendationCount", label: "Rejected security recommendations" },
  { value: "AcceptanceRatePercent", label: "Acceptance rate %" },
];

const COND_OPS = [
  { value: "GreaterThanOrEqual", label: "≥" },
  { value: "GreaterThan", label: ">" },
  { value: "LessThanOrEqual", label: "≤" },
  { value: "LessThan", label: "<" },
];

const SEVERITIES = ["Info", "Warning", "High", "Critical"];

function CandidateCard({
  evaluation,
  highlight,
}: {
  evaluation: ThresholdCandidateEvaluation;
  highlight: boolean;
}) {
  const { candidate, simulationResult, scoreBreakdown } = evaluation;
  return (
    <div
      className={`rounded-lg p-3 ${highlight ? "border-2 border-neutral-700 bg-neutral-50 dark:border-neutral-300 dark:bg-neutral-900" : "border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-950"}`}
    >
      <strong>Threshold: {candidate.thresholdValue}</strong> ({candidate.label})
      <div className={cn("mt-2", OPERATOR_TYPOGRAPHY.body)}>
        <div>Evaluated reviews: {simulationResult.evaluatedRunCount}</div>
        <div>Matched: {simulationResult.matchedCount}</div>
        <div>Would create: {simulationResult.wouldCreateCount}</div>
        <div>Would suppress: {simulationResult.wouldSuppressCount}</div>
      </div>
      <div className="mt-2">
        <strong>{ALERT_TUNING_RANKING_FACTORS_HEADING}</strong>
        <ul className="my-1 pl-5">
          {formatAlertTuningScoreAxisLines(scoreBreakdown).map((line) => (
            <li key={line.label}>
              {line.emphasize ? <strong>{line.label}: {line.value}</strong> : `${line.label}: ${line.value}`}
            </li>
          ))}
        </ul>
        <ul className={cn("mt-2 pl-5 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
          {scoreBreakdown.notes.map((note, i) => (
            <li key={i}>{note}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function AlertTuningContent() {
  const canMutateEnterpriseShell = useOperateCapability();
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
                  <CandidateCard evaluation={result.recommendedCandidate} highlight />
                </section>
              ) : null}

              <h4 className={cn("mb-2 mt-2", OPERATOR_TYPOGRAPHY.sectionTitle)}>
                All candidates (highest overall ranking first)
              </h4>
              <div className="grid gap-3">
                {[...result.candidates]
                  .sort((a, b) => b.scoreBreakdown.finalScore - a.scoreBreakdown.finalScore)
                  .map((c, i) => (
                    <CandidateCard
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

        <section className="min-w-0" aria-labelledby="alert-tuning-change-heading">
          <h3 id="alert-tuning-change-heading" className={cn("mb-2 mt-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>
            {alertToolingChangeConfigurationHeadingOperator}
          </h3>
          <p className={cn("mb-2.5 mt-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
            {alertToolingConfigureSectionSubline}
          </p>
      <div className="mb-6 grid max-w-3xl gap-3">
        <div>
          <Label htmlFor="alert-tuning-rule-kind">Rule kind</Label>
          <select
            id="alert-tuning-rule-kind"
            value={ruleKind}
            onChange={(e) => setRuleKind(e.target.value as "Simple" | "Composite")}
            className={ALERT_TOOLING_FORM_SELECT_CLASS}
          >
            <option value="Simple">Simple</option>
            <option value="Composite">Composite</option>
          </select>
        </div>

        <div>
          <Label htmlFor="alert-tuning-name">Name</Label>
          <Input
            id="alert-tuning-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1"
          />
        </div>

        {ruleKind === "Simple" ? (
          <div>
            <Label htmlFor="alert-tuning-simple-rule-type">Rule type (simple)</Label>
            <select
              id="alert-tuning-simple-rule-type"
              value={ruleType}
              onChange={(e) => setRuleType(e.target.value)}
              className={ALERT_TOOLING_FORM_SELECT_CLASS}
            >
              {SIMPLE_RULE_TYPES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <>
            <div>
              <Label htmlFor="alert-tuning-composite-metric">Metric to tune (must match a condition below)</Label>
              <select
                id="alert-tuning-composite-metric"
                value={tunedMetricComposite}
                onChange={(e) => setTunedMetricComposite(e.target.value)}
                className={ALERT_TOOLING_FORM_SELECT_CLASS}
              >
                {COMPOSITE_METRICS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="alert-tuning-composite-join">Join</Label>
              <select
                id="alert-tuning-composite-join"
                value={cJoin}
                onChange={(e) => setCJoin(e.target.value)}
                className={ALERT_TOOLING_FORM_SELECT_CLASS}
              >
                <option value="And">All (AND)</option>
                <option value="Or">Any (OR)</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="alert-tuning-composite-suppression-window">Suppression window (min)</Label>
                <Input
                  id="alert-tuning-composite-suppression-window"
                  type="number"
                  value={cSuppression}
                  onChange={(e) => setCSuppression(Number(e.target.value))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="alert-tuning-composite-cooldown">Cooldown (min)</Label>
                <Input
                  id="alert-tuning-composite-cooldown"
                  type="number"
                  value={cCooldown}
                  onChange={(e) => setCCooldown(Number(e.target.value))}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="alert-tuning-composite-dedupe-scope">Dedupe scope</Label>
              <select
                id="alert-tuning-composite-dedupe-scope"
                value={cDedupe}
                onChange={(e) => setCDedupe(e.target.value)}
                className={ALERT_TOOLING_FORM_SELECT_CLASS}
              >
                <option value="RuleOnly">Rule only</option>
                <option value="RuleAndRun">Rule + review</option>
                <option value="RuleAndComparison">Rule + review + comparison</option>
              </select>
            </div>
            <p className="m-0 font-semibold">Condition 1</p>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label htmlFor="alert-tuning-composite-c1-metric">Metric</Label>
                <select
                  id="alert-tuning-composite-c1-metric"
                  value={cM1}
                  onChange={(e) => setCM1(e.target.value)}
                  className={ALERT_TOOLING_FORM_SELECT_CLASS}
                >
                  {COMPOSITE_METRICS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="alert-tuning-composite-c1-operator">Operator</Label>
                <select
                  id="alert-tuning-composite-c1-operator"
                  value={cO1}
                  onChange={(e) => setCO1(e.target.value)}
                  className={ALERT_TOOLING_FORM_SELECT_CLASS}
                >
                  {COND_OPS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="alert-tuning-composite-c1-threshold">Threshold</Label>
                <Input
                  id="alert-tuning-composite-c1-threshold"
                  type="number"
                  value={cV1}
                  onChange={(e) => setCV1(Number(e.target.value))}
                  className="mt-1"
                />
              </div>
            </div>
            <p className="m-0 font-semibold">Condition 2</p>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label htmlFor="alert-tuning-composite-c2-metric">Metric</Label>
                <select
                  id="alert-tuning-composite-c2-metric"
                  value={cM2}
                  onChange={(e) => setCM2(e.target.value)}
                  className={ALERT_TOOLING_FORM_SELECT_CLASS}
                >
                  {COMPOSITE_METRICS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="alert-tuning-composite-c2-operator">Operator</Label>
                <select
                  id="alert-tuning-composite-c2-operator"
                  value={cO2}
                  onChange={(e) => setCO2(e.target.value)}
                  className={ALERT_TOOLING_FORM_SELECT_CLASS}
                >
                  {COND_OPS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="alert-tuning-composite-c2-threshold">Threshold</Label>
                <Input
                  id="alert-tuning-composite-c2-threshold"
                  type="number"
                  value={cV2}
                  onChange={(e) => setCV2(Number(e.target.value))}
                  className="mt-1"
                />
              </div>
            </div>
          </>
        )}

        <div>
          <Label htmlFor="alert-tuning-severity">Severity</Label>
          <select
            id="alert-tuning-severity"
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
            className={ALERT_TOOLING_FORM_SELECT_CLASS}
          >
            {SEVERITIES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="alert-tuning-candidate-thresholds">Candidate thresholds (comma-separated)</Label>
          <Input
            id="alert-tuning-candidate-thresholds"
            value={candidateThresholdsStr}
            onChange={(e) => setCandidateThresholdsStr(e.target.value)}
            placeholder="5,10,15,20,25"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="alert-tuning-recent-count">Recent review count (1–50)</Label>
          <Input
            id="alert-tuning-recent-count"
            type="number"
            min={1}
            max={50}
            value={recentRunCount}
            onChange={(e) => setRecentRunCount(Number(e.target.value))}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="alert-tuning-project-slug">Workspace project slug</Label>
          <Input
            id="alert-tuning-project-slug"
            value={runSlug}
            onChange={(e) => setRunSlug(e.target.value)}
            placeholder={ALERT_SIMULATION_PROJECT_SLUG_PLACEHOLDER}
            className="mt-1"
            data-testid="alert-tuning-project-slug"
          />
          <span className={cn("mt-1 block text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
            {ALERT_SIMULATION_PROJECT_SLUG_HELPER}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="alert-tuning-target-min">Target created alerts (min)</Label>
            <Input
              id="alert-tuning-target-min"
              type="number"
              min={0}
              value={targetMin}
              onChange={(e) => setTargetMin(Number(e.target.value))}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="alert-tuning-target-max">Target created alerts (max)</Label>
            <Input
              id="alert-tuning-target-max"
              type="number"
              min={0}
              value={targetMax}
              onChange={(e) => setTargetMax(Number(e.target.value))}
              className="mt-1"
            />
          </div>
        </div>

        <div className="inline-flex items-center gap-1">
          <Button
            type="button"
            variant="primary"
            size="sm"
            data-testid="alert-tuning-recommend-submit"
            onClick={() => void recommend()}
            disabled={loading}
            className="max-w-[240px]"
          >
            {loading ? "Running…" : "Recommend threshold"}
          </Button>
          <FieldHelpTooltip label="Recommend threshold" hint={alertTuningRecommendButtonTitle} />
        </div>
      </div>
        </section>
      </div>
    </div>
  );
}
