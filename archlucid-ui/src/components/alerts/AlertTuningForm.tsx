"use client";

import { cn } from "@/lib/utils";
import type { Dispatch, SetStateAction } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ALERT_SIMULATION_PROJECT_SLUG_HELPER,
  ALERT_SIMULATION_PROJECT_SLUG_PLACEHOLDER,
  ALERT_TOOLING_FORM_SELECT_CLASS,
} from "@/lib/alert-simulation-form";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { AlertTuningFormComposite } from "@/components/alerts/AlertTuningForm-composite";
import {
  AlertTuningFormRecommendChecklist,
  AlertTuningFormRecommendSubmit,
} from "@/components/alerts/AlertTuningForm-recommend";
import { AlertTuningFormSimple } from "@/components/alerts/AlertTuningForm-simple";
import type { IntegrationConnectChecklistStep } from "@/components/integrations/IntegrationConnectChecklist";

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
      <AlertTuningFormRecommendChecklist
        recommendSteps={recommendSteps}
        recommendEmphasizedStepId={recommendEmphasizedStepId}
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
          <AlertTuningFormSimple ruleType={ruleType} setRuleType={setRuleType} />
        ) : (
          <AlertTuningFormComposite
            tunedMetricComposite={tunedMetricComposite}
            setTunedMetricComposite={setTunedMetricComposite}
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
          />
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

        <AlertTuningFormRecommendSubmit loading={loading} onRecommend={onRecommend} />
      </div>
    </>
  );
}
