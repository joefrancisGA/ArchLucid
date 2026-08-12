"use client";

import { cn } from "@/lib/utils";
import { useCallback, useEffect, useState } from "react";
import { AlertOperatorToolingRankCue } from "@/components/EnterpriseControlsContextHints";
import { GettingStartedSteps } from "@/components/GettingStartedSteps";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusTag } from "@/components/ui/status-tag";
import { useOperateCapability } from "@/hooks/use-operate-capability";
import { useOptionalAlertRulesHubRefresh } from "@/lib/alerts-hub-refresh-context";
import { createCompositeAlertRule, listCompositeAlertRules } from "@/lib/api";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import {
  alertToolingChangeConfigurationHeadingOperator,
  alertToolingChangeConfigurationHeadingReader,
  alertToolingConfigureSectionSubline,
  alertToolingListRefreshButtonTitleOperator,
  alertToolingListRefreshButtonTitleReader,
  compositeRulesCreateButtonLabelReaderRank,
  compositeRulesCurrentRulesHeadingOperator,
  compositeRulesCurrentRulesHeadingReader,
  compositeRulesDefinedListEmptyOperatorLine,
  compositeRulesDefinedListEmptyReaderLine,
  compositeRulesPageLeadOperator,
  compositeRulesPageLeadReader,
  compositeRulesRefreshAssistReaderLine,
  enterpriseMutationControlDisabledTitle,
} from "@/lib/enterprise-controls-context-copy";
import {
  compositeRulesEmptyGettingStartedOperator,
  compositeRulesEmptyGettingStartedReader,
} from "@/lib/alerts-hub-empty-guidance";
import {
  COMPOSITE_ALERT_CONDITION_OPERATOR_OPTIONS,
  COMPOSITE_ALERT_DEDUPE_SCOPE_OPTIONS,
  COMPOSITE_ALERT_JOIN_OPERATOR_OPTIONS,
  COMPOSITE_ALERT_METRIC_OPTIONS,
  compositeAlertRuleStatusKind,
  compositeAlertRuleStatusLabel,
  formatCompositeAlertConditionSummary,
  formatCompositeAlertRuleSummary,
} from "@/lib/composite-alert-rules-labels";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { CompositeAlertRule } from "@/types/composite-alert-rules";

const SEVERITIES = ["Info", "Warning", "High", "Critical"];

function CompositeAlertRulesListLoadingSkeleton(): React.JSX.Element {
  return (
    <div
      className="grid gap-3"
      data-testid="composite-alert-rules-list-loading-skeleton"
      aria-busy="true"
      aria-label="Loading composite alert rules"
    >
      <Skeleton className="h-28 w-full rounded-lg border border-neutral-200 dark:border-neutral-700" />
      <Skeleton className="h-28 w-full rounded-lg border border-neutral-200 dark:border-neutral-700" />
    </div>
  );
}

export function CompositeAlertRulesContent() {
  const canMutateComposite = useOperateCapability();
  const refreshContext = useOptionalAlertRulesHubRefresh();
  const [items, setItems] = useState<CompositeAlertRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [failure, setFailure] = useState<ApiLoadFailureState | null>(null);

  const [name, setName] = useState("Cost + compliance composite");
  const [severity, setSeverity] = useState("High");
  const [joinOperator, setJoinOperator] = useState("And");
  const [suppressionWindowMinutes, setSuppressionWindowMinutes] = useState(1440);
  const [cooldownMinutes, setCooldownMinutes] = useState(60);
  const [dedupeScope, setDedupeScope] = useState("RuleAndRun");

  const [m1, setM1] = useState("CostIncreasePercent");
  const [o1, setO1] = useState("GreaterThanOrEqual");
  const [v1, setV1] = useState(10);

  const [m2, setM2] = useState("NewComplianceGapCount");
  const [o2, setO2] = useState("GreaterThanOrEqual");
  const [v2, setV2] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setFailure(null);
    try {
      const data = await listCompositeAlertRules();
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

  useEffect(() => {
    if (refreshContext === null) {
      return;
    }

    return refreshContext.registerTabLoader("advanced-rules", load);
  }, [load, refreshContext]);

  async function onCreate() {
    if (!canMutateComposite) {
      return;
    }

    setFailure(null);
    try {
      await createCompositeAlertRule({
        name: name.trim() || "Composite rule",
        severity,
        operator: joinOperator,
        suppressionWindowMinutes,
        cooldownMinutes,
        reopenDeltaThreshold: 0,
        dedupeScope,
        conditions: [
          { metricType: m1, operator: o1, thresholdValue: v1 },
          { metricType: m2, operator: o2, thresholdValue: v2 },
        ],
      });
      await load();
    } catch (e) {
      setFailure(toApiLoadFailure(e));
    }
  }

  return (
    <div>
      <p className={cn("mb-2 max-w-prose leading-snug text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
        {canMutateComposite ? compositeRulesPageLeadOperator : compositeRulesPageLeadReader}
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

      <div className="flex flex-col gap-8">
        <section
          className={cn("min-w-0", !canMutateComposite && "opacity-95")}
          aria-labelledby="composite-rules-current-heading"
        >
          <h3 id="composite-rules-current-heading" className={cn("mt-2", OPERATOR_TYPOGRAPHY.sectionTitle)}>
            {canMutateComposite ? compositeRulesCurrentRulesHeadingOperator : compositeRulesCurrentRulesHeadingReader}
          </h3>
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => void load()}
              disabled={loading}
              title={
                canMutateComposite
                  ? alertToolingListRefreshButtonTitleOperator
                  : alertToolingListRefreshButtonTitleReader
              }
            >
              {loading ? "Loading…" : "Refresh"}
            </Button>
            {!canMutateComposite ? (
              <span className={cn("max-w-prose text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                {compositeRulesRefreshAssistReaderLine}
              </span>
            ) : null}
          </div>
          <div className="grid gap-3.5">
            {loading && items.length === 0 ? (
              <CompositeAlertRulesListLoadingSkeleton />
            ) : items.length === 0 ? (
              <div className="grid max-w-xl gap-3">
                <p className={cn("text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
                  {canMutateComposite ? compositeRulesDefinedListEmptyOperatorLine : compositeRulesDefinedListEmptyReaderLine}
                </p>
                <GettingStartedSteps
                  {...(canMutateComposite
                    ? compositeRulesEmptyGettingStartedOperator
                    : compositeRulesEmptyGettingStartedReader)}
                />
              </div>
            ) : (
              items.map((r) => (
                <article
                  key={r.compositeRuleId}
                  className="rounded-lg border border-neutral-200 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-950"
                  aria-label={`Composite alert rule ${r.name}`}
                  data-testid={`composite-alert-rule-row-${r.compositeRuleId}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <strong>{r.name}</strong>
                    <StatusTag
                      kind={compositeAlertRuleStatusKind(r.isEnabled)}
                      label={compositeAlertRuleStatusLabel(r.isEnabled)}
                      data-testid={`composite-alert-rule-status-${r.compositeRuleId}`}
                    />
                  </div>
                  <div className={cn("mt-2", OPERATOR_TYPOGRAPHY.body)}>
                    <p className="mb-2 text-neutral-600 dark:text-neutral-400">{formatCompositeAlertRuleSummary(r)}</p>
                    <ul className="mt-2">
                      {(r.conditions ?? []).map((c) => (
                        <li key={c.conditionId ?? `${c.metricType}-${c.thresholdValue}`}>
                          {formatCompositeAlertConditionSummary(c)}
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <section
          className={cn("min-w-0", !canMutateComposite && "opacity-90")}
          aria-labelledby="composite-rules-change-heading"
        >
          <h3 id="composite-rules-change-heading" className={OPERATOR_TYPOGRAPHY.sectionTitle}>
            {canMutateComposite
              ? alertToolingChangeConfigurationHeadingOperator
              : alertToolingChangeConfigurationHeadingReader}
          </h3>
          <p className={cn("mb-2.5 mt-0 max-w-2xl text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
            {alertToolingConfigureSectionSubline}
          </p>
      <fieldset
        disabled={!canMutateComposite}
        title={canMutateComposite ? undefined : enterpriseMutationControlDisabledTitle}
        aria-label="New composite rule form"
        className="m-0 border-none p-0"
      >
      <div className="mb-7 grid max-w-3xl gap-3">
        <label>
          Name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full p-2"
          />
        </label>
        <label>
          Severity when fired
          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
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
          Combine conditions
          <select
            value={joinOperator}
            onChange={(e) => setJoinOperator(e.target.value)}
            className="mt-1 block w-full p-2"
          >
            {COMPOSITE_ALERT_JOIN_OPERATOR_OPTIONS.map((j) => (
              <option key={j.value} value={j.value}>
                {j.label}
              </option>
            ))}
          </select>
        </label>

        <fieldset className="rounded-lg border border-neutral-300 p-3 dark:border-neutral-600">
          <legend>Condition 1</legend>
          <div className="grid gap-2">
            <label>
              Metric
              <select
                value={m1}
                onChange={(e) => setM1(e.target.value)}
                className="mt-1 block w-full p-2"
              >
                {COMPOSITE_ALERT_METRIC_OPTIONS.map((x) => (
                  <option key={x.value} value={x.value}>
                    {x.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Operator
              <select
                value={o1}
                onChange={(e) => setO1(e.target.value)}
                className="mt-1 block w-full p-2"
              >
                {COMPOSITE_ALERT_CONDITION_OPERATOR_OPTIONS.map((x) => (
                  <option key={x.value} value={x.value}>
                    {x.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Threshold value
              <input
                type="number"
                step="any"
                value={v1}
                onChange={(e) => setV1(Number(e.target.value))}
                className="mt-1 block w-full p-2"
              />
            </label>
          </div>
        </fieldset>

        <fieldset className="rounded-lg border border-neutral-300 p-3 dark:border-neutral-600">
          <legend>Condition 2</legend>
          <div className="grid gap-2">
            <label>
              Metric
              <select
                value={m2}
                onChange={(e) => setM2(e.target.value)}
                className="mt-1 block w-full p-2"
              >
                {COMPOSITE_ALERT_METRIC_OPTIONS.map((x) => (
                  <option key={x.value} value={x.value}>
                    {x.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Operator
              <select
                value={o2}
                onChange={(e) => setO2(e.target.value)}
                className="mt-1 block w-full p-2"
              >
                {COMPOSITE_ALERT_CONDITION_OPERATOR_OPTIONS.map((x) => (
                  <option key={x.value} value={x.value}>
                    {x.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Threshold value
              <input
                type="number"
                step="any"
                value={v2}
                onChange={(e) => setV2(Number(e.target.value))}
                className="mt-1 block w-full p-2"
              />
            </label>
          </div>
        </fieldset>

        <label>
          Suppression window (minutes)
          <input
            type="number"
            value={suppressionWindowMinutes}
            onChange={(e) => setSuppressionWindowMinutes(Number(e.target.value))}
            className="mt-1 block w-full p-2"
          />
        </label>
        <label>
          Cooldown (minutes)
          <input
            type="number"
            value={cooldownMinutes}
            onChange={(e) => setCooldownMinutes(Number(e.target.value))}
            className="mt-1 block w-full p-2"
          />
        </label>
        <label>
          Dedupe scope
          <select
            value={dedupeScope}
            onChange={(e) => setDedupeScope(e.target.value)}
            className="mt-1 block w-full p-2"
          >
            {COMPOSITE_ALERT_DEDUPE_SCOPE_OPTIONS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={() => void onCreate()}
          disabled={loading || !canMutateComposite}
          title={canMutateComposite ? undefined : enterpriseMutationControlDisabledTitle}
          className={cn(
            !canMutateComposite &&
              "rounded border border-neutral-300 bg-neutral-50 text-neutral-600 dark:border-neutral-600 dark:bg-neutral-900/50 dark:text-neutral-400",
          )}
        >
          {canMutateComposite ? "Create composite rule" : compositeRulesCreateButtonLabelReaderRank}
        </button>
      </div>
      </fieldset>
        </section>
      </div>
    </div>
  );
}
