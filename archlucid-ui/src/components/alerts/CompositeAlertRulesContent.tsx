"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { FieldHelpTooltip } from "@/components/FieldHelpTooltip";
import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { AlertOperatorToolingRankCue } from "@/components/EnterpriseControlsContextHints";
import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { IntegrationConnectChecklist } from "@/components/integrations/IntegrationConnectChecklist";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MetadataStatusLabel } from "@/components/ui/metadata-status-label";
import { Skeleton } from "@/components/ui/skeleton";
import { WhyDisabledCtaHint } from "@/components/usability/WhyDisabledCtaHint";
import { useOperateCapability } from "@/hooks/use-operate-capability";
import { useCompositeAlertRulesListQuery } from "@/components/alerts/use-alert-rules-hub-queries";
import { useOptionalAlertRulesHubRefresh } from "@/lib/alerts-hub-refresh-context";
import { createCompositeAlertRule } from "@/lib/api";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { latestCompositeAlertRulesConfigChange } from "@/lib/composite-alert-rules-config-change";
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
import {
  COMPOSITE_ALERT_RULE_NAME_PLACEHOLDER,
  formatCompositeAlertRuleCreateConfirmationSummary,
  isCompositeAlertRuleFormValid,
  validateCompositeAlertRuleForm,
  type CompositeAlertRuleFormInput,
} from "@/lib/composite-alert-rules-form";
import {
  resolveCompositeAlertRulesCreateEmphasizedStepId,
  resolveCompositeAlertRulesCreateSteps,
} from "@/lib/composite-alert-rules-create-checklist";
import {
  alertToolingChangeConfigurationHeadingOperator,
  alertToolingChangeConfigurationHeadingReader,
  alertToolingConfigureSectionSubline,
  COMPOSITE_RULES_CONDITIONS_TAB_LINK_LABEL,
  COMPOSITE_RULES_CREATE_ONLY_DISCLOSURE,
  COMPOSITE_RULES_EMPTY_EXAMPLE_BODY,
  COMPOSITE_RULES_EMPTY_EXAMPLE_HEADING,
  compositeRulesCreateButtonLabelOperator,
  compositeRulesCreateButtonLabelReaderRank,
  compositeRulesCurrentRulesHeadingOperator,
  compositeRulesCurrentRulesHeadingReader,
  compositeRulesDefinedListEmptyOperatorLine,
  compositeRulesDefinedListEmptyReaderLine,
  compositeRulesPageLeadOperator,
  compositeRulesPageLeadOperatorEmpty,
  compositeRulesPageLeadReader,
} from "@/lib/enterprise-controls-context-copy";
import { COMPOSITE_RULES_LIST_EMPTY_COMPACT } from "@/lib/enterprise-compact-empty-state-presets";
import { enterpriseStatusTagClass, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { governanceAlertRulesTabHref } from "@/lib/governance/governance-route-paths";
import { whyDisabledEnterpriseMutationControl } from "@/lib/why-disabled-cta";
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

const COMPOSITE_ALERT_RULE_STATE_CHIP_HINT =
  "Read-only state — composite rules cannot be disabled from this workspace.";

function CompositeAlertRuleStateChip(props: {
  readonly isEnabled: boolean;
  readonly ruleId: string;
}): React.JSX.Element {
  const kind = compositeAlertRuleStatusKind(props.isEnabled);
  const label = compositeAlertRuleStatusLabel(props.isEnabled);

  return (
    <span className="inline-flex items-center gap-1">
      <MetadataStatusLabel
        className={enterpriseStatusTagClass(kind)}
        data-testid={`composite-alert-rule-state-${props.ruleId}`}
        aria-readonly="true"
      >
        {label}
      </MetadataStatusLabel>
      <FieldHelpTooltip label="Rule state" hint={COMPOSITE_ALERT_RULE_STATE_CHIP_HINT} />
    </span>
  );
}

export function CompositeAlertRulesContent() {
  const canMutateComposite = useOperateCapability();
  const compositeRulesQuery = useCompositeAlertRulesListQuery();
  const refreshContext = useOptionalAlertRulesHubRefresh();
  const reportTabLoadedRef = useRef(refreshContext?.reportTabLoaded);
  reportTabLoadedRef.current = refreshContext?.reportTabLoaded;
  const items = compositeRulesQuery.items;
  const loading = compositeRulesQuery.loading;
  const [mutationFailure, setMutationFailure] = useState<ApiLoadFailureState | null>(null);
  const failure = compositeRulesQuery.failure ?? mutationFailure;
  const [showCreatePanel, setShowCreatePanel] = useState(false);
  const [showCreateConfirmation, setShowCreateConfirmation] = useState(false);
  const [createBusy, setCreateBusy] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [ruleSaved, setRuleSaved] = useState(false);

  const [name, setName] = useState("");
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

  const formInput = useMemo<CompositeAlertRuleFormInput>(
    () => ({
      name,
      severity,
      joinOperator,
      suppressionWindowMinutes,
      cooldownMinutes,
      dedupeScope,
      condition1: { metricType: m1, operator: o1, thresholdValue: v1 },
      condition2: { metricType: m2, operator: o2, thresholdValue: v2 },
    }),
    [cooldownMinutes, dedupeScope, joinOperator, m1, m2, name, o1, o2, severity, suppressionWindowMinutes, v1, v2],
  );
  const fieldErrors = useMemo(() => validateCompositeAlertRuleForm(formInput), [formInput]);
  const formValid = useMemo(() => isCompositeAlertRuleFormValid(formInput), [formInput]);
  const createConfirmationSummary = useMemo(
    () => formatCompositeAlertRuleCreateConfirmationSummary(formInput),
    [formInput],
  );

  const refreshCompositeRulesTab = useCallback(async () => {
    await compositeRulesQuery.refresh();
  }, [compositeRulesQuery.refresh]);

  useEffect(() => {
    if (refreshContext === null) {
      return;
    }

    return refreshContext.registerTabLoader("advanced-rules", refreshCompositeRulesTab);
  }, [refreshCompositeRulesTab, refreshContext]);

  useEffect(() => {
    if (loading || compositeRulesQuery.failure !== null) {
      return;
    }

    reportTabLoadedRef.current?.(
      "advanced-rules",
      items.length,
      latestCompositeAlertRulesConfigChange(items),
    );
  }, [compositeRulesQuery.failure, items, loading]);

  function revealCreatePanel(): void {
    setShowCreatePanel(true);
  }

  async function executeCreate(): Promise<void> {
    if (!canMutateComposite) {
      return;
    }

    setMutationFailure(null);
    setCreateBusy(true);

    try {
      await createCompositeAlertRule({
        name: name.trim(),
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
      await compositeRulesQuery.refresh();
      setShowCreateConfirmation(false);
      setSubmitAttempted(false);
      setRuleSaved(true);
    } catch (e) {
      setMutationFailure(toApiLoadFailure(e));
    } finally {
      setCreateBusy(false);
    }
  }

  function onRequestCreate(): void {
    setSubmitAttempted(true);

    if (!formValid) {
      return;
    }

    setShowCreateConfirmation(true);
  }

  const isEmpty = items.length === 0;
  const emptyIntroMode = isEmpty && canMutateComposite && !showCreatePanel && !loading;
  const showCreateForm = !canMutateComposite || showCreatePanel || !isEmpty;
  const sectionGap = emptyIntroMode ? "gap-4" : "gap-8";
  const conditionsTabHref = governanceAlertRulesTabHref("rules");
  const mutationDisabledReason = canMutateComposite ? null : whyDisabledEnterpriseMutationControl();
  const mutationDisabledHintId = "composite-rules-mutate-disabled-hint";
  const nameAndSeverityConfigured = name.trim().length > 0 && severity.trim().length > 0;
  const conditionsConfigured =
    fieldErrors.threshold1 === undefined &&
    fieldErrors.threshold2 === undefined &&
    fieldErrors.metrics === undefined &&
    m1.trim().length > 0 &&
    m2.trim().length > 0;
  const compositeCreateSteps = resolveCompositeAlertRulesCreateSteps({
    nameAndSeverityConfigured,
    conditionsConfigured,
    ruleSaved,
  });
  const compositeCreateEmphasizedStepId = resolveCompositeAlertRulesCreateEmphasizedStepId({
    nameAndSeverityConfigured,
    conditionsConfigured,
    ruleSaved,
  });

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
          <h3 id="composite-rules-current-heading" className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.sectionTitle)}>
            {canMutateComposite ? compositeRulesCurrentRulesHeadingOperator : compositeRulesCurrentRulesHeadingReader}
          </h3>

          <p
            className={cn("mb-3 mt-1 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
            data-testid="composite-rules-create-only-disclosure"
          >
            {COMPOSITE_RULES_CREATE_ONLY_DISCLOSURE}
          </p>

          {canMutateComposite ? (
            <div className="mb-4 flex flex-wrap items-center gap-2" data-testid="composite-rules-action-row">
              <Button
                type="button"
                size="sm"
                variant="primary"
                data-testid="composite-rules-create-action"
                onClick={revealCreatePanel}
              >
                {compositeRulesCreateButtonLabelOperator}
              </Button>
            </div>
          ) : null}

          <div className="grid gap-3.5">
            {loading && items.length === 0 ? (
              <CompositeAlertRulesListLoadingSkeleton />
            ) : emptyIntroMode ? (
              <EnterpriseCompactEmptyState
                {...COMPOSITE_RULES_LIST_EMPTY_COMPACT}
                footer={
                  <div className="flex w-full flex-col gap-3">
                    <div
                      className="rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900/40"
                      data-testid="composite-rules-empty-example"
                    >
                      <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.helper)}>
                        {COMPOSITE_RULES_EMPTY_EXAMPLE_HEADING}
                      </p>
                      <p className={cn("m-0 mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                        {COMPOSITE_RULES_EMPTY_EXAMPLE_BODY}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="primary"
                        data-testid="composite-rules-empty-create-action"
                        onClick={revealCreatePanel}
                      >
                        {compositeRulesCreateButtonLabelOperator}
                      </Button>
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="border-neutral-300 dark:border-neutral-600"
                      >
                        <Link
                          href={conditionsTabHref}
                          data-testid="composite-rules-empty-conditions-link"
                        >
                          {COMPOSITE_RULES_CONDITIONS_TAB_LINK_LABEL}
                        </Link>
                      </Button>
                    </div>
                  </div>
                }
              />
            ) : items.length === 0 ? (
              <p className={cn("text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
                {canMutateComposite ? compositeRulesDefinedListEmptyOperatorLine : compositeRulesDefinedListEmptyReaderLine}
              </p>
            ) : (
              items.map((r: CompositeAlertRule) => (
                <article
                  key={r.compositeRuleId}
                  className="rounded-lg border border-neutral-200 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-950"
                  aria-label={`Composite alert rule ${r.name}`}
                  data-testid={`composite-alert-rule-row-${r.compositeRuleId}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <strong>{r.name}</strong>
                    <CompositeAlertRuleStateChip isEnabled={r.isEnabled} ruleId={r.compositeRuleId} />
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
          <WhyDisabledCtaHint
            id={mutationDisabledHintId}
            reason={mutationDisabledReason}
            testId="composite-rules-mutate-disabled-hint"
          />
      {canMutateComposite ? (
        <div className="mb-4 max-w-2xl">
          <IntegrationConnectChecklist
            title="Create checklist"
            steps={compositeCreateSteps}
            emphasizedStepId={compositeCreateEmphasizedStepId}
            testIdPrefix="composite-alert-rules-create"
          />
        </div>
      ) : null}
      <fieldset
        disabled={!canMutateComposite}
        aria-label="New composite rule form"
        className="m-0 border-none p-0"
      >
      <div className="mb-7 grid max-w-3xl gap-4">
        <div>
          <Label htmlFor="composite-rule-name">Name</Label>
          <Input
            id="composite-rule-name"
            value={name}
            placeholder={COMPOSITE_ALERT_RULE_NAME_PLACEHOLDER}
            onChange={(event) => setName(event.target.value)}
            className="mt-1"
            aria-invalid={submitAttempted && fieldErrors.name !== undefined}
            aria-describedby={submitAttempted && fieldErrors.name ? "composite-rule-name-error" : undefined}
          />
          {submitAttempted && fieldErrors.name ? (
            <p id="composite-rule-name-error" className={cn("mt-1 text-red-600 dark:text-red-400", OPERATOR_TYPOGRAPHY.helper)}>
              {fieldErrors.name}
            </p>
          ) : null}
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
                aria-invalid={submitAttempted && fieldErrors.threshold1 !== undefined}
                aria-describedby={submitAttempted && fieldErrors.threshold1 ? "composite-rule-m1-threshold-error" : undefined}
              />
              {submitAttempted && fieldErrors.threshold1 ? (
                <p id="composite-rule-m1-threshold-error" className={cn("mt-1 text-red-600 dark:text-red-400", OPERATOR_TYPOGRAPHY.helper)}>
                  {fieldErrors.threshold1}
                </p>
              ) : null}
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
                aria-invalid={submitAttempted && fieldErrors.metrics !== undefined}
                aria-describedby={
                  submitAttempted && fieldErrors.metrics ? "composite-rule-metrics-error" : undefined
                }
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
                aria-invalid={submitAttempted && fieldErrors.threshold2 !== undefined}
                aria-describedby={submitAttempted && fieldErrors.threshold2 ? "composite-rule-m2-threshold-error" : undefined}
              />
              {submitAttempted && fieldErrors.threshold2 ? (
                <p id="composite-rule-m2-threshold-error" className={cn("mt-1 text-red-600 dark:text-red-400", OPERATOR_TYPOGRAPHY.helper)}>
                  {fieldErrors.threshold2}
                </p>
              ) : null}
            </div>
          </div>
          {submitAttempted && fieldErrors.metrics ? (
            <p id="composite-rule-metrics-error" className={cn("mt-2 text-red-600 dark:text-red-400", OPERATOR_TYPOGRAPHY.helper)}>
              {fieldErrors.metrics}
            </p>
          ) : null}
        </fieldset>

        <div>
          <Label htmlFor="composite-rule-suppression-minutes">Suppression window (minutes)</Label>
          <Input
            id="composite-rule-suppression-minutes"
            type="number"
            value={suppressionWindowMinutes}
            onChange={(event) => setSuppressionWindowMinutes(Number(event.target.value))}
            className="mt-1"
            aria-invalid={submitAttempted && fieldErrors.suppressionWindowMinutes !== undefined}
            aria-describedby={
              submitAttempted && fieldErrors.suppressionWindowMinutes
                ? "composite-rule-suppression-minutes-error"
                : undefined
            }
          />
          {submitAttempted && fieldErrors.suppressionWindowMinutes ? (
            <p
              id="composite-rule-suppression-minutes-error"
              className={cn("mt-1 text-red-600 dark:text-red-400", OPERATOR_TYPOGRAPHY.helper)}
            >
              {fieldErrors.suppressionWindowMinutes}
            </p>
          ) : null}
        </div>
        <div>
          <Label htmlFor="composite-rule-cooldown-minutes">Cooldown (minutes)</Label>
          <Input
            id="composite-rule-cooldown-minutes"
            type="number"
            value={cooldownMinutes}
            onChange={(event) => setCooldownMinutes(Number(event.target.value))}
            className="mt-1"
            aria-invalid={submitAttempted && fieldErrors.cooldownMinutes !== undefined}
            aria-describedby={
              submitAttempted && fieldErrors.cooldownMinutes ? "composite-rule-cooldown-minutes-error" : undefined
            }
          />
          {submitAttempted && fieldErrors.cooldownMinutes ? (
            <p
              id="composite-rule-cooldown-minutes-error"
              className={cn("mt-1 text-red-600 dark:text-red-400", OPERATOR_TYPOGRAPHY.helper)}
            >
              {fieldErrors.cooldownMinutes}
            </p>
          ) : null}
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
          onClick={onRequestCreate}
          disabled={loading || !canMutateComposite || !formValid}
          aria-describedby={mutationDisabledReason === null ? undefined : mutationDisabledHintId}
        >
          {canMutateComposite ? compositeRulesCreateButtonLabelOperator : compositeRulesCreateButtonLabelReaderRank}
        </Button>
      </div>
      </fieldset>
        </section>
        ) : null}
      </div>

      <ConfirmationDialog
        open={showCreateConfirmation}
        onOpenChange={setShowCreateConfirmation}
        title="Create composite rule?"
        description={createConfirmationSummary}
        confirmLabel={compositeRulesCreateButtonLabelOperator}
        variant="default"
        busy={createBusy}
        onConfirm={() => {
          void executeCreate();
        }}
      />
    </div>
  );
}
