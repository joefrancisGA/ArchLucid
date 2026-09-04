"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ALERT_TOOLING_FORM_SELECT_CLASS } from "@/lib/alert-simulation-form";
import type { Dispatch, SetStateAction } from "react";

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

export type AlertTuningFormCompositeProps = {
  readonly tunedMetricComposite: string;
  readonly setTunedMetricComposite: Dispatch<SetStateAction<string>>;
  readonly cJoin: string;
  readonly setCJoin: Dispatch<SetStateAction<string>>;
  readonly cSuppression: number;
  readonly setCSuppression: Dispatch<SetStateAction<number>>;
  readonly cCooldown: number;
  readonly setCCooldown: Dispatch<SetStateAction<number>>;
  readonly cDedupe: string;
  readonly setCDedupe: Dispatch<SetStateAction<string>>;
  readonly cM1: string;
  readonly setCM1: Dispatch<SetStateAction<string>>;
  readonly cO1: string;
  readonly setCO1: Dispatch<SetStateAction<string>>;
  readonly cV1: number;
  readonly setCV1: Dispatch<SetStateAction<number>>;
  readonly cM2: string;
  readonly setCM2: Dispatch<SetStateAction<string>>;
  readonly cO2: string;
  readonly setCO2: Dispatch<SetStateAction<string>>;
  readonly cV2: number;
  readonly setCV2: Dispatch<SetStateAction<number>>;
};

export function AlertTuningFormComposite(props: AlertTuningFormCompositeProps) {
  const {
    tunedMetricComposite,
    setTunedMetricComposite,
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
  } = props;

  return (
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
  );
}
