"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { AlertOperatorToolingRankCue } from "@/components/EnterpriseControlsContextHints";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { AlertRuleListRow } from "@/components/alerts/AlertRuleListRow";
import { AlertRuleLivePreviewPanel } from "@/components/alerts/AlertRuleLivePreviewPanel";
import { AlertRuleNotificationReadinessPanel } from "@/components/alerts/AlertRuleNotificationReadinessPanel";
import { AlertRuleSimulateModal } from "@/components/alerts/AlertRuleSimulateModal";
import { MutatingInWorkspaceChip } from "@/components/MutatingInWorkspaceChip";
import { WhyDisabledCtaHint } from "@/components/usability/WhyDisabledCtaHint";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useOperateCapability } from "@/hooks/use-operate-capability";
import { useOptionalAlertRulesHubRefresh } from "@/lib/alerts-hub-refresh-context";
import { createAlertRule, listAlertRoutingSubscriptions, listAlertRules } from "@/lib/api";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import {
  ALERT_PRIORITY_OPTIONS,
  ALERT_RULE_FORM_DEFAULT_DRAFT,
  ALERT_RULE_TYPE_OPTIONS,
  alertRuleFormDiffersFromDefaultDraft,
  describeThresholdComparison,
  isAlertRuleFormValid,
  resolveAlertRuleScopePreviewProjectId,
  usesIntegerThreshold,
  validateAlertRuleForm,
  type AlertRuleFormInput,
} from "@/lib/alert-rule-conditions";
import {
  hasAlertRulesLivePreviewPinContent,
  OPERATOR_LIVE_PREVIEW_READINESS_RAIL_KIND,
  shouldPinLivePreviewReadinessRail,
} from "@/lib/operator/operator-live-preview-readiness-rail";
import {
  ALERT_RULES_ALERT_PRIORITY_HELP,
  ALERT_RULES_ALERT_PRIORITY_LABEL,
  ALERT_RULES_CREATE_BLOCKED_HINT,
  ALERT_RULES_CREATE_BUTTON_LABEL,
  ALERT_RULES_CREATE_HEADING,
  ALERT_RULES_CREATE_PENDING_LABEL,
  ALERT_RULES_CREATE_SUCCESS_MESSAGE,
  ALERT_RULES_FORM_SECTION_ARIA_LABEL,
  ALERT_RULES_LIST_HEADING,
  ALERT_RULES_NAME_LABEL,
  ALERT_RULES_RULE_TYPE_HELP,
  ALERT_RULES_RULE_TYPE_LABEL,
  ALERT_RULES_SAMPLE_MODE_BANNER,
  ALERT_RULES_SAMPLE_MODE_CTA_HREF,
  ALERT_RULES_SAMPLE_MODE_CTA_LABEL,
  ALERT_RULES_STATUS_LIVE_REGION_LABEL,
} from "@/lib/alert-rule-conditions-copy";
import { ALERT_RULES_LIST_EMPTY_COMPACT } from "@/lib/enterprise-compact-empty-state-presets";
import { isBuyerPolishedOperatorShellEnv, isOperatorExperienceFullShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  alertRulesCreateButtonLabelReaderRank,
} from "@/lib/enterprise-controls-context-copy";
import { whyDisabledEnterpriseMutationControl } from "@/lib/why-disabled-cta";
import { readOperatorScopeFromStorage } from "@/lib/operator/operator-scope-storage";
import type { AlertRule } from "@/types/alerts";
import type { AlertRoutingSubscription } from "@/types/alert-routing";

export function AlertRulesContent() {
  const canMutateAlertRules = useOperateCapability();
  const refreshContext = useOptionalAlertRulesHubRefresh();
  const sampleModeBlocked: boolean =
    isBuyerPolishedOperatorShellEnv() && !isOperatorExperienceFullShellEnv();
  const canEdit: boolean = canMutateAlertRules && !sampleModeBlocked;
  const statusRegionId = useId();
  const createInFlightRef = useRef(false);

  const [items, setItems] = useState<AlertRule[]>([]);
  const [routingSubscriptions, setRoutingSubscriptions] = useState<AlertRoutingSubscription[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [failure, setFailure] = useState<ApiLoadFailureState | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [simulateForRule, setSimulateForRule] = useState<AlertRule | null>(null);
  const [showCreatePanel, setShowCreatePanel] = useState(false);

  // Server render has no storage; project id is adopted after mount to avoid a hydration mismatch.
  const [sessionProjectId, setSessionProjectId] = useState<string | undefined>(undefined);

  const [name, setName] = useState(ALERT_RULE_FORM_DEFAULT_DRAFT.name);
  const [ruleType, setRuleType] = useState(ALERT_RULE_FORM_DEFAULT_DRAFT.ruleType);
  const [alertPriority, setAlertPriority] = useState(ALERT_RULE_FORM_DEFAULT_DRAFT.alertPriority);
  const [threshold, setThreshold] = useState(ALERT_RULE_FORM_DEFAULT_DRAFT.thresholdValue);
  const [fieldTouched, setFieldTouched] = useState({ name: false, threshold: false });

  const formInput: AlertRuleFormInput = useMemo(
    () => ({
      name,
      ruleType,
      alertPriority,
      thresholdValue: threshold,
    }),
    [alertPriority, name, ruleType, threshold],
  );

  const fieldErrors = useMemo(() => validateAlertRuleForm(formInput), [formInput]);
  const formValid = useMemo(() => isAlertRuleFormValid(formInput), [formInput]);
  const thresholdStep = usesIntegerThreshold(ruleType) ? 1 : 0.1;

  const load = useCallback(async () => {
    setLoading(true);
    setFailure(null);

    // TB-2024: rules + routing in parallel (routing failure must not block the rules list).
    const [rulesOutcome, routingOutcome] = await Promise.allSettled([
      listAlertRules(),
      listAlertRoutingSubscriptions(),
    ]);

    if (rulesOutcome.status === "fulfilled") {
      setItems(rulesOutcome.value);
    } else {
      setFailure(toApiLoadFailure(rulesOutcome.reason));
    }

    if (routingOutcome.status === "fulfilled") {
      setRoutingSubscriptions(routingOutcome.value);
    } else {
      setRoutingSubscriptions([]);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    setSessionProjectId(readOperatorScopeFromStorage()?.projectId);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (refreshContext === null) {
      return;
    }

    return refreshContext.registerTabLoader("rules", load);
  }, [load, refreshContext]);

  async function onCreate() {
    if (!canEdit || createInFlightRef.current) {
      return;
    }

    setFieldTouched({ name: true, threshold: true });

    if (!formValid) {
      return;
    }

    createInFlightRef.current = true;
    setCreating(true);
    setFailure(null);
    setStatusMessage(null);

    try {
      await createAlertRule({
        name: name.trim(),
        ruleType,
        severity: alertPriority,
        thresholdValue: threshold,
        isEnabled: true,
      });
      await load();
      setStatusMessage(ALERT_RULES_CREATE_SUCCESS_MESSAGE);
    } catch (error) {
      setFailure(toApiLoadFailure(error));
    } finally {
      createInFlightRef.current = false;
      setCreating(false);
    }
  }

  const scopePreviewRule: Pick<AlertRule, "projectId"> = useMemo(
    () => ({
      projectId: resolveAlertRuleScopePreviewProjectId(items[0]?.projectId, sessionProjectId),
    }),
    [items, sessionProjectId],
  );

  const draftReadinessRule = useMemo(() => ({ isEnabled: true }), []);

  // TB-1574: pin live preview/readiness rail only when rules exist or draft left empty defaults.
  const pinLivePreviewRail = shouldPinLivePreviewReadinessRail(
    hasAlertRulesLivePreviewPinContent({
      existingRuleCount: items.length,
      draftDiffersFromDefault: alertRuleFormDiffersFromDefaultDraft(formInput),
    }),
  );
  const mutationDisabledReason = canMutateAlertRules ? null : whyDisabledEnterpriseMutationControl();
  const mutationDisabledHintId = "alert-rules-mutate-disabled-hint";

  const isEmpty = items.length === 0;
  const showCreateForm = !canEdit || showCreatePanel || !isEmpty;
  const emptyIntroMode = isEmpty && canEdit && !showCreatePanel;
  const sectionGap = pinLivePreviewRail ? "gap-8" : "gap-4";

  return (
    <div className="min-w-0">
      <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
        <h3 id="alert-rules-conditions-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>
          Alert conditions
        </h3>
        {emptyIntroMode ? (
          <Button
            type="button"
            size="sm"
            variant="primary"
            data-testid="alert-rules-create-action"
            onClick={() => setShowCreatePanel(true)}
          >
            {ALERT_RULES_CREATE_BUTTON_LABEL}
          </Button>
        ) : null}
      </div>

      {sampleModeBlocked ? (
        <div
          role="status"
          className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100"
        >
          <p className={cn("mb-2", OPERATOR_TYPOGRAPHY.body)}>{ALERT_RULES_SAMPLE_MODE_BANNER}</p>
          <Link href={ALERT_RULES_SAMPLE_MODE_CTA_HREF} className="font-medium underline underline-offset-2">
            {ALERT_RULES_SAMPLE_MODE_CTA_LABEL}
          </Link>
        </div>
      ) : null}

      <AlertOperatorToolingRankCue />

      <div
        id={statusRegionId}
        role="status"
        aria-live="polite"
        aria-label={ALERT_RULES_STATUS_LIVE_REGION_LABEL}
        className="sr-only"
      >
        {statusMessage}
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

      <div
        className={cn(
          "grid",
          sectionGap,
          pinLivePreviewRail && "xl:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]",
        )}
        data-testid="alert-rules-layout"
        data-rail-kind={OPERATOR_LIVE_PREVIEW_READINESS_RAIL_KIND}
        data-live-rail-pinned={pinLivePreviewRail ? "true" : "false"}
        data-empty-intro={emptyIntroMode ? "true" : "false"}
      >
        <div className={cn("flex min-w-0 flex-col", sectionGap)}>
          {items.length > 0 ? (
            <section aria-labelledby="alert-rules-list-heading">
              <h3 id="alert-rules-list-heading" className={cn("m-0 mb-3", OPERATOR_TYPOGRAPHY.sectionTitle)}>
                {ALERT_RULES_LIST_HEADING}
              </h3>

              <div className="grid gap-3">
                {items.map((rule) => (
                  <AlertRuleListRow
                    key={rule.ruleId}
                    rule={rule}
                    routingSubscriptions={routingSubscriptions}
                    onSimulate={setSimulateForRule}
                  />
                ))}
              </div>
            </section>
          ) : null}

          {emptyIntroMode ? (
            <EnterpriseCompactEmptyState {...ALERT_RULES_LIST_EMPTY_COMPACT} />
          ) : null}

          {isEmpty && !canEdit ? (
            <EnterpriseCompactEmptyState {...ALERT_RULES_LIST_EMPTY_COMPACT} />
          ) : null}

          {showCreateForm ? (
            <section aria-labelledby="alert-rules-create-heading" aria-label={ALERT_RULES_FORM_SECTION_ARIA_LABEL}>
              <h3 id="alert-rules-create-heading" className={cn("mb-3 mt-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>
                {ALERT_RULES_CREATE_HEADING}
              </h3>

              <div className="grid max-w-2xl gap-4">
              <div>
                <Label htmlFor="alert-rule-name">{ALERT_RULES_NAME_LABEL}</Label>
                <Input
                  id="alert-rule-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  onBlur={() => setFieldTouched((current) => ({ ...current, name: true }))}
                  disabled={!canEdit || creating}
                  className="mt-1"
                />
                {fieldTouched.name && fieldErrors.name ? (
                  <p className={cn("mt-1 text-red-600 dark:text-red-400", OPERATOR_TYPOGRAPHY.helper)} role="alert">
                    {fieldErrors.name}
                  </p>
                ) : null}
              </div>

              <div>
                <Label htmlFor="alert-rule-type">{ALERT_RULES_RULE_TYPE_LABEL}</Label>
                <select
                  id="alert-rule-type"
                  value={ruleType}
                  onChange={(event) => setRuleType(event.target.value)}
                  disabled={!canEdit || creating}
                  className="mt-1 block w-full rounded-md border border-neutral-300 bg-white p-2 dark:border-neutral-600 dark:bg-neutral-950"
                >
                  {ALERT_RULE_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className={cn("mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                  {ALERT_RULES_RULE_TYPE_HELP}
                </p>
              </div>

              <div>
                <Label htmlFor="alert-rule-priority">{ALERT_RULES_ALERT_PRIORITY_LABEL}</Label>
                <select
                  id="alert-rule-priority"
                  value={alertPriority}
                  onChange={(event) => setAlertPriority(event.target.value)}
                  disabled={!canEdit || creating}
                  className="mt-1 block w-full rounded-md border border-neutral-300 bg-white p-2 dark:border-neutral-600 dark:bg-neutral-950"
                >
                  {ALERT_PRIORITY_OPTIONS.map((priority) => (
                    <option key={priority} value={priority}>
                      {priority}
                    </option>
                  ))}
                </select>
                <p className={cn("mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                  {ALERT_RULES_ALERT_PRIORITY_HELP}
                </p>
              </div>

              {ruleType !== "RejectedSecurityRecommendation" ? (
                <div>
                  <Label htmlFor="alert-rule-threshold">{describeThresholdComparison(ruleType)}</Label>
                  <Input
                    id="alert-rule-threshold"
                    type="number"
                    step={thresholdStep}
                    min={1}
                    value={Number.isFinite(threshold) ? threshold : ""}
                    onChange={(event) => {
                      const parsed = Number(event.target.value);

                      if (Number.isFinite(parsed)) {
                        setThreshold(parsed);
                      }
                    }}
                    onBlur={() => setFieldTouched((current) => ({ ...current, threshold: true }))}
                    disabled={!canEdit || creating}
                    className="mt-1"
                  />
                  {fieldTouched.threshold && fieldErrors.thresholdValue ? (
                    <p className={cn("mt-1 text-red-600 dark:text-red-400", OPERATOR_TYPOGRAPHY.helper)} role="alert">
                      {fieldErrors.thresholdValue}
                    </p>
                  ) : null}
                </div>
              ) : null}

              <div className="grid gap-2">
                <MutatingInWorkspaceChip />

                <div className="flex flex-col items-start gap-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => void onCreate()}
                      disabled={loading || creating || !canEdit || !formValid}
                      aria-describedby={mutationDisabledReason === null ? undefined : mutationDisabledHintId}
                      data-testid="alert-rules-create-button"
                    >
                      {creating
                        ? ALERT_RULES_CREATE_PENDING_LABEL
                        : canEdit
                          ? ALERT_RULES_CREATE_BUTTON_LABEL
                          : alertRulesCreateButtonLabelReaderRank}
                    </Button>

                    {canEdit && !formValid ? (
                      <p
                        className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                        data-testid="alert-rules-create-readiness"
                      >
                        {ALERT_RULES_CREATE_BLOCKED_HINT}
                      </p>
                    ) : null}
                  </div>
                  <WhyDisabledCtaHint
                    id={mutationDisabledHintId}
                    reason={mutationDisabledReason}
                    testId="alert-rules-mutate-disabled-hint"
                  />
                </div>
              </div>
              </div>
            </section>
          ) : null}
        </div>

        {pinLivePreviewRail ? (
          <div className="grid min-w-0 gap-4">
            <AlertRuleLivePreviewPanel form={formInput} />
            <AlertRuleNotificationReadinessPanel
              scopeRule={scopePreviewRule}
              readinessRule={draftReadinessRule}
              routingSubscriptions={routingSubscriptions}
              draftForm={formInput}
            />
          </div>
        ) : null}
      </div>

      <AlertRuleSimulateModal
        rule={simulateForRule}
        open={simulateForRule !== null}
        onOpenChange={(next) => {
          if (!next) {
            setSimulateForRule(null);
          }
        }}
      />
    </div>
  );
}

