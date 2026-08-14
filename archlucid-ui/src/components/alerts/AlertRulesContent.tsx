"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { AlertOperatorToolingRankCue } from "@/components/EnterpriseControlsContextHints";
import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { AlertRuleListRow } from "@/components/alerts/AlertRuleListRow";
import { AlertRuleLivePreviewPanel } from "@/components/alerts/AlertRuleLivePreviewPanel";
import { AlertRuleNotificationReadinessPanel } from "@/components/alerts/AlertRuleNotificationReadinessPanel";
import { AlertRuleSimulateModal } from "@/components/alerts/AlertRuleSimulateModal";
import { MutatingInWorkspaceChip } from "@/components/MutatingInWorkspaceChip";
import { WhyDisabledCtaHint } from "@/components/usability/WhyDisabledCtaHint";
import { Button } from "@/components/ui/button";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableHead,
  EnterpriseTableHeaderCell,
  EnterpriseTableHeadRow,
} from "@/components/ui/enterprise-table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useOperateCapability } from "@/hooks/use-operate-capability";
import { useOptionalAlertRulesHubRefresh } from "@/lib/alerts-hub-refresh-context";
import {
  useAlertRoutingSubscriptionsQuery,
  useAlertRulesListQuery,
} from "@/components/alerts/use-alert-rules-hub-queries";
import { createAlertRule } from "@/lib/api";
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
  ALERT_RULES_LIST_EMPTY_BODY,
  ALERT_RULES_LIST_HEADING,
  ALERT_RULES_NAME_LABEL,
  ALERT_RULES_NOTIFICATION_EXTERNAL_NOT_CONFIGURED,
  ALERT_RULES_NOTIFICATIONS_TAB_LINK_LABEL,
  ALERT_RULES_RULE_TYPE_HELP,
  ALERT_RULES_RULE_TYPE_LABEL,
  ALERT_RULES_SAMPLE_MODE_BANNER,
  ALERT_RULES_SAMPLE_MODE_CTA_HREF,
  ALERT_RULES_SAMPLE_MODE_CTA_LABEL,
  ALERT_RULES_STATUS_LIVE_REGION_LABEL,
} from "@/lib/alert-rule-conditions-copy";
import { latestAlertRulesConfigChange } from "@/lib/alert-rules-config-change";
import { ALERT_RULES_LIST_EMPTY_COMPACT } from "@/lib/enterprise-compact-empty-state-presets";
import { isBuyerPolishedOperatorShellEnv, isOperatorExperienceFullShellEnv } from "@/lib/demo-ui-env";
import { DESIGN_TOKENS, OPERATOR_BODY_INLINE_LINK_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { governanceAlertRulesTabHref } from "@/lib/governance/governance-route-paths";
import {
  alertRulesCreateButtonLabelReaderRank,
} from "@/lib/enterprise-controls-context-copy";
import { whyDisabledEnterpriseMutationControl, whyDisabledIncompleteInput } from "@/lib/why-disabled-cta";
import { readOperatorScopeFromStorage } from "@/lib/operator/operator-scope-storage";
import type { AlertRule } from "@/types/alerts";

function AlertRulesListLoadingSkeleton(): React.JSX.Element {
  return (
    <div
      className="grid gap-3"
      data-testid="alert-rules-list-loading-skeleton"
      aria-busy="true"
      aria-label="Loading alert rules"
    >
      <Skeleton className="h-10 w-full rounded-lg border border-neutral-200 dark:border-neutral-700" />
      <Skeleton className="h-10 w-full rounded-lg border border-neutral-200 dark:border-neutral-700" />
      <Skeleton className="h-10 w-full rounded-lg border border-neutral-200 dark:border-neutral-700" />
    </div>
  );
}

export function AlertRulesContent() {
  const canMutateAlertRules = useOperateCapability();
  const refreshContext = useOptionalAlertRulesHubRefresh();
  const registerTabLoader = refreshContext?.registerTabLoader;
  const reportTabLoaded = refreshContext?.reportTabLoaded;
  const sampleModeBlocked: boolean =
    isBuyerPolishedOperatorShellEnv() && !isOperatorExperienceFullShellEnv();
  const canEdit: boolean = canMutateAlertRules && !sampleModeBlocked;
  const statusRegionId = useId();
  const createInFlightRef = useRef(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const didFocusEmptyIntroRef = useRef(false);

  const rulesQuery = useAlertRulesListQuery();
  const routingQuery = useAlertRoutingSubscriptionsQuery();
  const [creating, setCreating] = useState(false);
  const [mutationFailure, setMutationFailure] = useState<ApiLoadFailureState | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const items = rulesQuery.items;
  const routingSubscriptions = routingQuery.items;
  const loading = rulesQuery.loading;
  const failure = rulesQuery.failure ?? mutationFailure;
  const [simulateForRule, setSimulateForRule] = useState<AlertRule | null>(null);

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
    await Promise.all([rulesQuery.refresh(), routingQuery.refresh()]);
  }, [routingQuery, rulesQuery]);

  useEffect(() => {
    setSessionProjectId(readOperatorScopeFromStorage()?.projectId);
  }, []);

  useEffect(() => {
    if (registerTabLoader === undefined) {
      return;
    }

    return registerTabLoader("rules", load);
  }, [load, registerTabLoader]);

  useEffect(() => {
    if (reportTabLoaded === undefined || loading || failure !== null) {
      return;
    }

    reportTabLoaded("rules", items.length, latestAlertRulesConfigChange(items));
  }, [failure, items, loading, reportTabLoaded]);

  useEffect(() => {
    if (!canEdit || didFocusEmptyIntroRef.current || loading || items.length > 0) {
      return;
    }

    didFocusEmptyIntroRef.current = true;
    nameInputRef.current?.focus();
  }, [canEdit, items.length, loading]);

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
    setMutationFailure(null);
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
      setMutationFailure(toApiLoadFailure(error));
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

  const listInitialLoading = loading && items.length === 0;
  const isEmpty = items.length === 0;
  const showEmptyCard = !listInitialLoading && isEmpty;
  const showCreateForm = canEdit || !isEmpty;
  const sectionGap = pinLivePreviewRail ? "gap-8" : "gap-4";

  const emptyStateDescription = useMemo(() => {
    const externalNotificationsUnconfigured = routingSubscriptions.length === 0;

    return (
      <>
        <p className="m-0">{ALERT_RULES_LIST_EMPTY_BODY}</p>
        {externalNotificationsUnconfigured ? (
          <p className="m-0 mt-2">
            {ALERT_RULES_NOTIFICATION_EXTERNAL_NOT_CONFIGURED}{" "}
            <Link href={governanceAlertRulesTabHref("notifications")} className={OPERATOR_BODY_INLINE_LINK_CLASS}>
              {ALERT_RULES_NOTIFICATIONS_TAB_LINK_LABEL}
            </Link>
          </p>
        ) : null}
      </>
    );
  }, [routingSubscriptions.length]);

  const emptyStateFooter = canEdit ? (
    <div className="flex flex-wrap items-center gap-2" data-testid="alert-rules-empty-footer">
      <Button
        type="button"
        variant="primary"
        data-testid="alert-rules-create-action"
        onClick={() => nameInputRef.current?.focus()}
      >
        {ALERT_RULES_CREATE_BUTTON_LABEL}
      </Button>
      <MutatingInWorkspaceChip />
    </div>
  ) : null;

  return (
    <div className="min-w-0">
      {sampleModeBlocked ? (
        <div
          role="status"
          className={cn("mb-4", DESIGN_TOKENS.callout.warn, "p-4")}
        >
          <p className={cn("mb-2", OPERATOR_TYPOGRAPHY.body)}>{ALERT_RULES_SAMPLE_MODE_BANNER}</p>
          <Link href={ALERT_RULES_SAMPLE_MODE_CTA_HREF} className={OPERATOR_BODY_INLINE_LINK_CLASS}>
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
        data-empty-intro={showEmptyCard && canEdit ? "true" : "false"}
      >
        <div className={cn("flex min-w-0 flex-col", sectionGap)}>
          {listInitialLoading ? <AlertRulesListLoadingSkeleton /> : null}

          {!listInitialLoading && items.length > 0 ? (
            <section aria-labelledby="alert-rules-list-heading">
              <h2 id="alert-rules-list-heading" className={cn("m-0 mb-3", OPERATOR_TYPOGRAPHY.sectionTitle)}>
                {ALERT_RULES_LIST_HEADING}
              </h2>

              <EnterpriseTable ariaLabel="Alert rules">
                <EnterpriseTableHead>
                  <EnterpriseTableHeadRow>
                    <EnterpriseTableHeaderCell>Name</EnterpriseTableHeaderCell>
                    <EnterpriseTableHeaderCell>Condition</EnterpriseTableHeaderCell>
                    <EnterpriseTableHeaderCell>Scope</EnterpriseTableHeaderCell>
                    <EnterpriseTableHeaderCell>Alert priority</EnterpriseTableHeaderCell>
                    <EnterpriseTableHeaderCell>Status</EnterpriseTableHeaderCell>
                    <EnterpriseTableHeaderCell>Notifications</EnterpriseTableHeaderCell>
                    <EnterpriseTableHeaderCell>Actions</EnterpriseTableHeaderCell>
                  </EnterpriseTableHeadRow>
                </EnterpriseTableHead>
                <EnterpriseTableBody>
                  {items.map((rule) => (
                    <AlertRuleListRow
                      key={rule.ruleId}
                      rule={rule}
                      routingSubscriptions={routingSubscriptions}
                      onSimulate={setSimulateForRule}
                    />
                  ))}
                </EnterpriseTableBody>
              </EnterpriseTable>
            </section>
          ) : null}

          {showEmptyCard ? (
            <EnterpriseCompactEmptyState
              {...ALERT_RULES_LIST_EMPTY_COMPACT}
              description={emptyStateDescription}
              footer={emptyStateFooter}
            />
          ) : null}

          {showCreateForm ? (
            <section aria-labelledby="alert-rules-create-heading" aria-label={ALERT_RULES_FORM_SECTION_ARIA_LABEL}>
              <h2 id="alert-rules-create-heading" className={cn("mb-3 mt-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>
                {ALERT_RULES_CREATE_HEADING}
              </h2>

              <div className="grid max-w-2xl gap-4">
              <div>
                <Label htmlFor="alert-rule-name">{ALERT_RULES_NAME_LABEL}</Label>
                <Input
                  ref={nameInputRef}
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
                <Select
                  value={ruleType}
                  onValueChange={setRuleType}
                  disabled={!canEdit || creating}
                >
                  <SelectTrigger
                    id="alert-rule-type"
                    className="mt-1"
                    aria-label={ALERT_RULES_RULE_TYPE_LABEL}
                    data-testid="alert-rule-type-select"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ALERT_RULE_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className={cn("mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                  {ALERT_RULES_RULE_TYPE_HELP}
                </p>
              </div>

              <div>
                <Label htmlFor="alert-rule-priority">{ALERT_RULES_ALERT_PRIORITY_LABEL}</Label>
                <Select
                  value={alertPriority}
                  onValueChange={setAlertPriority}
                  disabled={!canEdit || creating}
                >
                  <SelectTrigger
                    id="alert-rule-priority"
                    className="mt-1"
                    aria-label={ALERT_RULES_ALERT_PRIORITY_LABEL}
                    data-testid="alert-rule-priority-select"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ALERT_PRIORITY_OPTIONS.map((priority) => (
                      <SelectItem key={priority} value={priority}>
                        {priority}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                <div className="flex flex-col items-start gap-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      type="button"
                      variant="primary"
                      onClick={() => void onCreate()}
                      disabled={loading || creating || !canEdit || !formValid}
                      aria-describedby={
                        canEdit
                          ? formValid
                            ? undefined
                            : "alert-rules-create-readiness"
                          : mutationDisabledHintId
                      }
                      data-testid="alert-rules-create-button"
                    >
                      {creating
                        ? ALERT_RULES_CREATE_PENDING_LABEL
                        : canEdit
                          ? ALERT_RULES_CREATE_BUTTON_LABEL
                          : alertRulesCreateButtonLabelReaderRank}
                    </Button>
                    {canEdit ? <MutatingInWorkspaceChip /> : null}

                    {canEdit ? (
                      <WhyDisabledCtaHint
                        id="alert-rules-create-readiness"
                        testId="alert-rules-create-readiness"
                        reason={formValid ? null : whyDisabledIncompleteInput(ALERT_RULES_CREATE_BLOCKED_HINT)}
                      />
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

