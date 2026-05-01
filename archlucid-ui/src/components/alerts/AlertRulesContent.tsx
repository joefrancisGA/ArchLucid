"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertOperatorToolingRankCue } from "@/components/EnterpriseControlsContextHints";
import { GettingStartedSteps } from "@/components/GettingStartedSteps";
import { GlossaryTooltip } from "@/components/GlossaryTooltip";
import { LayerHeader } from "@/components/LayerHeader";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { useEnterpriseMutationCapability } from "@/hooks/use-enterprise-mutation-capability";
import { createAlertRule, listAlertRules } from "@/lib/api";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import {
  alertRulesCreateButtonLabelReaderRank,
  alertRulesCurrentRulesHeadingOperator,
  alertRulesCurrentRulesHeadingReader,
  alertRulesDefinedListEmptyOperatorLine,
  alertRulesDefinedListEmptyReaderLine,
  alertRulesPageLeadOperator,
  alertRulesPageLeadReader,
  alertToolingChangeConfigurationHeadingOperator,
  alertToolingChangeConfigurationHeadingReader,
  alertToolingConfigureSectionSubline,
  alertToolingListRefreshButtonTitleOperator,
  alertToolingListRefreshButtonTitleReader,
  enterpriseMutationControlDisabledTitle,
} from "@/lib/enterprise-controls-context-copy";
import {
  alertRulesEmptyGettingStartedOperator,
  alertRulesEmptyGettingStartedReader,
} from "@/lib/alerts-hub-empty-guidance";
import { cn } from "@/lib/utils";
import type { AlertRule } from "@/types/alerts";

const RULE_TYPES = [
  { value: "CriticalRecommendationCount", label: "Critical / high recommendation count" },
  { value: "NewComplianceGapCount", label: "New compliance gap count (security deltas)" },
  { value: "CostIncreasePercent", label: "Cost increase %" },
  { value: "DeferredHighPriorityRecommendationAgeDays", label: "Deferred high-priority age (days)" },
  { value: "RejectedSecurityRecommendation", label: "Rejected security recommendation" },
  { value: "AcceptanceRateDrop", label: "Acceptance rate below %" },
];

const SEVERITIES = ["Info", "Warning", "High", "Critical"];

export function AlertRulesContent() {
  const canMutateAlertRules = useEnterpriseMutationCapability();
  const [items, setItems] = useState<AlertRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [failure, setFailure] = useState<ApiLoadFailureState | null>(null);

  const [name, setName] = useState("Architecture alert rule");
  const [ruleType, setRuleType] = useState("CriticalRecommendationCount");
  const [severity, setSeverity] = useState("Warning");
  const [threshold, setThreshold] = useState(3);

  const load = useCallback(async () => {
    setLoading(true);
    setFailure(null);
    try {
      const data = await listAlertRules();
      setItems(data);
    } catch (e) {
      setFailure(toApiLoadFailure(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onCreate() {
    if (!canMutateAlertRules) {
      return;
    }

    setFailure(null);
    try {
      await createAlertRule({
        name: name.trim() || "Rule",
        ruleType,
        severity,
        thresholdValue: threshold,
        isEnabled: true,
      });
      await load();
    } catch (e) {
      setFailure(toApiLoadFailure(e));
    }
  }

  return (
    <div className="max-w-3xl">
      <LayerHeader pageKey="alert-rules" />
      <h2 className="mt-0">Alert rules</h2>
      <p className="mb-2 max-w-prose text-sm leading-snug text-neutral-600 dark:text-neutral-400">
        {canMutateAlertRules ? alertRulesPageLeadOperator : alertRulesPageLeadReader}
      </p>
      <p className="mb-2 max-w-prose text-xs leading-snug text-neutral-600 dark:text-neutral-500">
        Thresholds are driven by <GlossaryTooltip termKey="findings">findings</GlossaryTooltip> from the{" "}
        <GlossaryTooltip termKey="finding_engine">finding engine</GlossaryTooltip> for completed runs in scope.
      </p>
      <AlertOperatorToolingRankCue />

      {failure !== null ? (
        <div role="alert">
          <OperatorApiProblem
            problem={failure.problem}
            fallbackMessage={failure.message}
            correlationId={failure.correlationId}
          />
        </div>
      ) : null}

      <div className="flex flex-col gap-6">
        <section
          className={cn("min-w-0", !canMutateAlertRules && "opacity-95")}
          aria-labelledby="alert-rules-current-heading"
        >
          <h3 id="alert-rules-current-heading" className="mb-2 mt-1 text-base">
            {canMutateAlertRules ? alertRulesCurrentRulesHeadingOperator : alertRulesCurrentRulesHeadingReader}
          </h3>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="mb-2"
            title={
              canMutateAlertRules
                ? alertToolingListRefreshButtonTitleOperator
                : alertToolingListRefreshButtonTitleReader
            }
          >
            {loading ? "Loading…" : "Refresh"}
          </button>
          <div className="grid gap-3">
            {items.length === 0 ? (
              <div className="grid max-w-xl gap-3">
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {canMutateAlertRules ? alertRulesDefinedListEmptyOperatorLine : alertRulesDefinedListEmptyReaderLine}
                </p>
                <GettingStartedSteps
                  {...(canMutateAlertRules ? alertRulesEmptyGettingStartedOperator : alertRulesEmptyGettingStartedReader)}
                />
              </div>
            ) : (
              items.map((r) => (
                <div
                  key={r.ruleId}
                  className="rounded-lg border border-neutral-200 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-950"
                >
                  <strong>{r.name}</strong>
                  <div className="mt-2 text-sm">
                    <div>Type: {r.ruleType}</div>
                    <div>Severity: {r.severity}</div>
                    <div>Threshold: {r.thresholdValue}</div>
                    <div>Enabled: {String(r.isEnabled)}</div>
                    <div>Channel: {r.targetChannelType}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section
          className={cn("min-w-0", !canMutateAlertRules && "opacity-90")}
          aria-labelledby="alert-rules-change-heading"
        >
          <h3 id="alert-rules-change-heading" className="mb-2 mt-1 text-base">
            {canMutateAlertRules
              ? alertToolingChangeConfigurationHeadingOperator
              : alertToolingChangeConfigurationHeadingReader}
          </h3>
          <p className="mb-2.5 mt-0 max-w-xl text-xs text-neutral-500 dark:text-neutral-400">
            {alertToolingConfigureSectionSubline}
          </p>
          <div className="mb-4 grid max-w-2xl gap-3">
            <label>
              Name
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!canMutateAlertRules}
                title={canMutateAlertRules ? undefined : enterpriseMutationControlDisabledTitle}
                className="mt-1 block w-full p-2"
              />
            </label>
            <label>
              Rule type
              <select
                value={ruleType}
                onChange={(e) => setRuleType(e.target.value)}
                disabled={!canMutateAlertRules}
                title={canMutateAlertRules ? undefined : enterpriseMutationControlDisabledTitle}
                className="mt-1 block w-full p-2"
              >
                {RULE_TYPES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Severity (when triggered)
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                disabled={!canMutateAlertRules}
                title={canMutateAlertRules ? undefined : enterpriseMutationControlDisabledTitle}
                className="mt-1 block w-full p-2"
              >
                {SEVERITIES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Threshold value
              <input
                type="number"
                step="any"
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                disabled={!canMutateAlertRules}
                title={canMutateAlertRules ? undefined : enterpriseMutationControlDisabledTitle}
                className="mt-1 block w-full p-2"
              />
            </label>
            <button
              type="button"
              onClick={() => void onCreate()}
              disabled={loading || !canMutateAlertRules}
              title={canMutateAlertRules ? undefined : enterpriseMutationControlDisabledTitle}
              className={cn(
                !canMutateAlertRules &&
                  "rounded border border-neutral-300 bg-neutral-50 text-neutral-600 dark:border-neutral-600 dark:bg-neutral-900/50 dark:text-neutral-400",
              )}
            >
              {canMutateAlertRules ? "Create rule" : alertRulesCreateButtonLabelReaderRank}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
