"use client";

import { cn } from "@/lib/utils";
import type { Dispatch, SetStateAction } from "react";

import { FieldHelpTooltip } from "@/components/FieldHelpTooltip";
import { IntegrationConnectChecklist, type IntegrationConnectChecklistStep } from "@/components/integrations/IntegrationConnectChecklist";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ALERT_SIMULATION_PROJECT_SLUG_HELPER,
  ALERT_SIMULATION_PROJECT_SLUG_PLACEHOLDER,
  ALERT_TOOLING_FORM_SELECT_CLASS,
} from "@/lib/alert-simulation-form";
import { alertTuningRecommendButtonTitle } from "@/lib/enterprise-controls-context-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

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

export type AlertTuningFormProps = {
  ruleKind: "Simple" | "Composite";
  setRuleKind: Dispatch<SetStateAction<"Simple" | "Composite">>;
  ruleType: string;
  setRuleType: Dispatch<SetStateAction<string>>;
  tunedMetricComposite: string;
  setTunedMetricComposite: Dispatch<SetStateAction<string>>;
  severity: string;
  setSeverity: Dispatch<SetStateAction<string>>;
  name: string;
  setName: Dispatch<SetStateAction<string>>;
  candidateThresholdsStr: string;
  setCandidateThresholdsStr: Dispatch<SetStateAction<string>>;
  recentRunCount: number;
  setRecentRunCount: Dispatch<SetStateAction<number>>;
  targetMin: number;
  setTargetMin: Dispatch<SetStateAction<number>>;
  targetMax: number;
  setTargetMax: Dispatch<SetStateAction<number>>;
  runSlug: string;
  setRunSlug: Dispatch<SetStateAction<string>>;
  cJoin: string;
  setCJoin: Dispatch<SetStateAction<string>>;
  cSuppression: number;
  setCSuppression: Dispatch<SetStateAction<number>>;
  cCooldown: number;
  setCCooldown: Dispatch<SetStateAction<number>>;
  cDedupe: string;
  setCDedupe: Dispatch<SetStateAction<string>>;
  cM1: string;
  setCM1: Dispatch<SetStateAction<string>>;
  cO1: string;
  setCO1: Dispatch<SetStateAction<string>>;
  cV1: number;
  setCV1: Dispatch<SetStateAction<number>>;
  cM2: string;
  setCM2: Dispatch<SetStateAction<string>>;
  cO2: string;
  setCO2: Dispatch<SetStateAction<string>>;
  cV2: number;
  setCV2: Dispatch<SetStateAction<number>>;
  loading: boolean;
  recommendSteps: readonly IntegrationConnectChecklistStep[];
  recommendEmphasizedStepId: string;
  onRecommend: () => void;
};

export function AlertTuningForm(props: AlertTuningFormProps) {
  const {
    ruleKind,
    setRuleKind,
    ruleType,
    setRuleType,
    tunedMetricComposite,
    setTunedMetricComposite,
    severity,
    setSeverity,
    name,
    setName,
    candidateThresholdsStr,
    setCandidateThresholdsStr,
    recentRunCount,
    setRecentRunCount,
    targetMin,
    setTargetMin,
    targetMax,
    setTargetMax,
    runSlug,
    setRunSlug,
    cJoin,
    setCJoin,
    cSuppression,
    setCSuppression,
    cCooldown,
    setCCooldown,
    cDedupe,
    setCDedupe,
    cM1,
    setCM1,
    cO1,
    setCO1,
    cV1,
    setCV1,
    cM2,
    setCM2,
    cO2,
    setCO2,
    cV2,
    setCV2,
    loading,
    recommendSteps,
    recommendEmphasizedStepId,
    onRecommend,
  } = props;

  return (
    <>
      <IntegrationConnectChecklist
        title="Recommend checklist"
        steps={recommendSteps}
        emphasizedStepId={recommendEmphasizedStepId}
        testIdPrefix="alert-tuning-recommend"
      />
      <div className="mb-6 mt-4 grid max-w-3xl gap-3">
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
            onClick={() => void onRecommend()}
            disabled={loading}
            className="max-w-[240px]"
          >
            {loading ? "Running…" : "Recommend threshold"}
          </Button>
          <FieldHelpTooltip label="Recommend threshold" hint={alertTuningRecommendButtonTitle} />
        </div>
      </div>
    </>
  );
}
