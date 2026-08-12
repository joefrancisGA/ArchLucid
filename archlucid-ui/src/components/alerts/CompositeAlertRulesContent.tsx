"use client";

import { cn } from "@/lib/utils";
import { useCallback, useEffect, useRef, useState } from "react";
import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { AlertOperatorToolingRankCue } from "@/components/EnterpriseControlsContextHints";
import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { Button } from "@/components/ui/button";
import { RefreshButton } from "@/components/ui/refresh-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  compositeRulesCreateButtonLabelOperator,
  compositeRulesCreateButtonLabelReaderRank,
  compositeRulesCurrentRulesHeadingOperator,
  compositeRulesCurrentRulesHeadingReader,
  compositeRulesDefinedListEmptyOperatorLine,
  compositeRulesDefinedListEmptyReaderLine,
  compositeRulesPageLeadOperator,
  compositeRulesPageLeadOperatorEmpty,
  compositeRulesPageLeadReader,
  compositeRulesRefreshAssistReaderLine,
  enterpriseMutationControlDisabledTitle,
} from "@/lib/enterprise-controls-context-copy";
import { COMPOSITE_RULES_LIST_EMPTY_COMPACT } from "@/lib/enterprise-compact-empty-state-presets";
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

const COMPOSITE_RULE_SELECT_CLASS =
  "mt-1 block w-full rounded-md border border-neutral-300 bg-white p-2 dark:border-neutral-600 dark:bg-neutral-950";

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
  const reportTabLoadedRef = useRef(refreshContext?.reportTabLoaded);
  reportTabLoadedRef.current = refreshContext?.reportTabLoaded;
  const [items, setItems] = useState<CompositeAlertRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [failure, setFailure] = useState<ApiLoadFailureState | null>(null);
  const [showCreatePanel, setShowCreatePanel] = useState(false);

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
      reportTabLoadedRef.current?.("advanced-rules", data.length);
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

  const isEmpty = items.length === 0;
  const emptyIntroMode = isEmpty && canMutateComposite && !showCreatePanel && !loading;
  const showCreateForm = !canMutateComposite || showCreatePanel || !isEmpty;
  const sectionGap = emptyIntroMode ? "gap-4" : "gap-8";

  return (
    <div>
      <p className={cn("mb-2 leading-snug text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
        {canMutateComposite
          ? emptyIntroMode
            ? compositeRulesPageLeadOperatorEmpty
            : compositeRulesPageLeadOperator
          : compositeRulesPageLeadReader}
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

      <div
        className={cn("flex flex-col", sectionGap)}
        data-testid="composite-alert-rules-layout"
        data-empty-intro={emptyIntroMode ? "true" : "false"}
      >
        <section
          className={cn("min-w-0", !canMutateComposite && "opacity-95")}
          aria-labelledby="composite-rules-current-heading"
        >
          <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
            <h3 id="composite-rules-current-heading" className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.sectionTitle)}>
              {canMutateComposite ? compositeRulesCurrentRulesHeadingOperator : compositeRulesCurrentRulesHeadingReader}
            </h3>
            {emptyIntroMode ? (
              <Button
                type="button"
                size="sm"
                variant="primary"
                data-testid="composite-rules-create-action"
                onClick={() => setShowCreatePanel(true)}
              >
                {compositeRulesCreateButtonLabelOperator}
              </Button>
            ) : null}
          </div>
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
            <RefreshButton busy={loading} onClick={() => void load()} />
            {!canMutateComposite ? (
              <span className={cn("text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                {compositeRulesRefreshAssistReaderLine}
              </span>
            ) : null}
          </div>
          <div className="grid gap-3.5">
            {loading && items.length === 0 ? (
              <CompositeAlertRulesListLoadingSkeleton />
            ) : emptyIntroMode ? (
              <EnterpriseCompactEmptyState {...COMPOSITE_RULES_LIST_EMPTY_COMPACT} />
            ) : items.length === 0 ? (
              <p className={cn("text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
                {canMutateComposite ? compositeRulesDefinedListEmptyOperatorLine : compositeRulesDefinedListEmptyReaderLine}
              </p>
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

        {showCreateForm ? (
        <section
          className={cn("min-w-0", !canMutateComposite && "opacity-90")}
          aria-labelledby="composite-rules-change-heading"
        >
          <h3 id="composite-rules-change-heading" className={OPERATOR_TYPOGRAPHY.sectionTitle}>
            {canMutateComposite
              ? alertToolingChangeConfigurationHeadingOperator
              : alertToolingChangeConfigurationHeadingReader}
          </h3>
          <p className={cn("mb-2.5 mt-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
            {alertToolingConfigureSectionSubline}
          </p>
      <fieldset
        disabled={!canMutateComposite}
        title={canMutateComposite ? undefined : enterpriseMutationControlDisabledTitle}
        aria-label="New composite rule form"
        className="m-0 border-none p-0"
      >
      <div className="mb-7 grid max-w-3xl gap-4">
        <div>
          <Label htmlFor="composite-rule-name">Name</Label>
          <Input
            id="composite-rule-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="composite-rule-severity">Severity when fired</Label>
          <select
            id="composite-rule-severity"
            value={severity}
            onChange={(event) => setSeverity(event.target.value)}
            className={COMPOSITE_RULE_SELECT_CLASS}
          >
            {SEVERITIES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="composite-rule-join-operator">Combine conditions</Label>
          <select
            id="composite-rule-join-operator"
            value={joinOperator}
            onChange={(event) => setJoinOperator(event.target.value)}
            className={COMPOSITE_RULE_SELECT_CLASS}
          >
            {COMPOSITE_ALERT_JOIN_OPERATOR_OPTIONS.map((j) => (
              <option key={j.value} value={j.value}>
                {j.label}
              </option>
            ))}
          </select>
        </div>

        <fieldset className="rounded-lg border border-neutral-300 p-3 dark:border-neutral-600">
          <legend>Condition 1</legend>
          <div className="grid gap-3">
            <div>
              <Label htmlFor="composite-rule-m1-metric">Metric</Label>
              <select
                id="composite-rule-m1-metric"
                value={m1}
                onChange={(event) => setM1(event.target.value)}
                className={COMPOSITE_RULE_SELECT_CLASS}
              >
                {COMPOSITE_ALERT_METRIC_OPTIONS.map((x) => (
                  <option key={x.value} value={x.value}>
                    {x.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="composite-rule-m1-operator">Operator</Label>
              <select
                id="composite-rule-m1-operator"
                value={o1}
                onChange={(event) => setO1(event.target.value)}
                className={COMPOSITE_RULE_SELECT_CLASS}
                aria-label="Operator"
              >
                {COMPOSITE_ALERT_CONDITION_OPERATOR_OPTIONS.map((x) => (
                  <option key={x.value} value={x.value}>
                    {x.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="composite-rule-m1-threshold">Threshold value</Label>
              <Input
                id="composite-rule-m1-threshold"
                type="number"
                step="any"
                value={v1}
                onChange={(event) => setV1(Number(event.target.value))}
                className="mt-1"
              />
            </div>
          </div>
        </fieldset>

        <fieldset className="rounded-lg border border-neutral-300 p-3 dark:border-neutral-600">
          <legend>Condition 2</legend>
          <div className="grid gap-3">
            <div>
              <Label htmlFor="composite-rule-m2-metric">Metric</Label>
              <select
                id="composite-rule-m2-metric"
                value={m2}
                onChange={(event) => setM2(event.target.value)}
                className={COMPOSITE_RULE_SELECT_CLASS}
              >
                {COMPOSITE_ALERT_METRIC_OPTIONS.map((x) => (
                  <option key={x.value} value={x.value}>
                    {x.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="composite-rule-m2-operator">Operator</Label>
              <select
                id="composite-rule-m2-operator"
                value={o2}
                onChange={(event) => setO2(event.target.value)}
                className={COMPOSITE_RULE_SELECT_CLASS}
                aria-label="Operator"
              >
                {COMPOSITE_ALERT_CONDITION_OPERATOR_OPTIONS.map((x) => (
                  <option key={x.value} value={x.value}>
                    {x.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="composite-rule-m2-threshold">Threshold value</Label>
              <Input
                id="composite-rule-m2-threshold"
                type="number"
                step="any"
                value={v2}
                onChange={(event) => setV2(Number(event.target.value))}
                className="mt-1"
              />
            </div>
          </div>
        </fieldset>

        <div>
          <Label htmlFor="composite-rule-suppression-minutes">Suppression window (minutes)</Label>
          <Input
            id="composite-rule-suppression-minutes"
            type="number"
            value={suppressionWindowMinutes}
            onChange={(event) => setSuppressionWindowMinutes(Number(event.target.value))}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="composite-rule-cooldown-minutes">Cooldown (minutes)</Label>
          <Input
            id="composite-rule-cooldown-minutes"
            type="number"
            value={cooldownMinutes}
            onChange={(event) => setCooldownMinutes(Number(event.target.value))}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="composite-rule-dedupe-scope">Dedupe scope</Label>
          <select
            id="composite-rule-dedupe-scope"
            value={dedupeScope}
            onChange={(event) => setDedupeScope(event.target.value)}
            className={COMPOSITE_RULE_SELECT_CLASS}
          >
            {COMPOSITE_ALERT_DEDUPE_SCOPE_OPTIONS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>

        <Button
          type="button"
          variant="primary"
          data-testid="composite-rules-create-button"
          onClick={() => void onCreate()}
          disabled={loading || !canMutateComposite}
          title={canMutateComposite ? undefined : enterpriseMutationControlDisabledTitle}
        >
          {canMutateComposite ? compositeRulesCreateButtonLabelOperator : compositeRulesCreateButtonLabelReaderRank}
        </Button>
      </div>
      </fieldset>
        </section>
        ) : null}
      </div>
    </div>
  );
}
