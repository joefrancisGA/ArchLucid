"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

import { AlertOperatorToolingRankCue } from "@/components/EnterpriseControlsContextHints";
import { AlertRulesCreateForm } from "@/components/alerts/AlertRulesCreateForm";
import { AlertRulesPickReviewBeforeCreatingStrip } from "@/components/alerts/AlertRulesPickReviewBeforeCreatingStrip";
import { AlertRulesNextReviewFooterClient } from "@/components/alerts/AlertRulesNextReviewFooterClient";
import { AlertRulesTable } from "@/components/alerts/AlertRulesTable";
import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { AlertRuleLivePreviewPanel } from "@/components/alerts/AlertRuleLivePreviewPanel";
import { AlertRuleNotificationReadinessPanel } from "@/components/alerts/AlertRuleNotificationReadinessPanel";
import { AlertRuleSimulateModal } from "@/components/alerts/AlertRuleSimulateModal";
import { MutatingInWorkspaceChip } from "@/components/MutatingInWorkspaceChip";
import { Button } from "@/components/ui/button";
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
  ALERT_RULE_FORM_DEFAULT_DRAFT,
  alertRuleFormDiffersFromDefaultDraft,
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
  ALERT_RULES_CREATE_BUTTON_LABEL,
  ALERT_RULES_CREATE_SUCCESS_MESSAGE,
  ALERT_RULES_LIST_EMPTY_BODY,
  ALERT_RULES_NOTIFICATION_EXTERNAL_NOT_CONFIGURED,
  ALERT_RULES_NOTIFICATIONS_TAB_LINK_LABEL,
  ALERT_RULES_SAMPLE_MODE_BANNER,
  ALERT_RULES_SAMPLE_MODE_CTA_HREF,
  ALERT_RULES_SAMPLE_MODE_CTA_LABEL,
  ALERT_RULES_STATUS_LIVE_REGION_LABEL,
} from "@/lib/alert-rule-conditions-copy";
import { latestAlertRulesConfigChange } from "@/lib/alert-rules-config-change";
import {
  resolveAlertRulesCreateEmphasizedStepId,
  resolveAlertRulesCreateSteps,
} from "@/lib/alert-rules-create-checklist";
import { isBuyerPolishedOperatorShellEnv, isOperatorExperienceFullShellEnv } from "@/lib/demo-ui-env";
import {
  DESIGN_TOKENS,
  OPERATOR_BODY_INLINE_LINK_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { governanceAlertRulesTabHref, GOVERNANCE_ALERT_RULES_PATH } from "@/lib/governance/governance-route-paths";
import { whyDisabledEnterpriseMutationControl } from "@/lib/why-disabled-cta";
import { readOperatorScopeFromStorage } from "@/lib/operator/operator-scope-storage";
import type { AlertRule } from "@/types/alerts";
import {
  resolveContinueLastAlertRule,
  writeAlertRuleLastViewedId,
} from "@/lib/resolve-continue-last-alert-rule";

export function AlertRulesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const scopedRunId = (searchParams.get("runId") ?? "").trim();
  const scopedRunFilterActive = scopedRunId.length > 0;

  const onPickReviewForCreating = useCallback(
    (reviewId: string) => {
      const trimmed = reviewId.trim();

      if (trimmed.length === 0) {
        return;
      }

      const params = new URLSearchParams(searchParams.toString());
      params.set("runId", trimmed);

      router.replace(`${GOVERNANCE_ALERT_RULES_PATH}?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

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
  const continueLastRule = useMemo(() => resolveContinueLastAlertRule(items), [items]);
  const routingSubscriptions = routingQuery.items;
  const loading = rulesQuery.loading;
  const failure = rulesQuery.failure ?? mutationFailure;
  const [simulateForRule, setSimulateForRule] = useState<AlertRule | null>(null);

  function rememberRule(ruleId: string): void {
    writeAlertRuleLastViewedId(ruleId);
  }

  function openRule(ruleId: string): void {
    rememberRule(ruleId);
    const match = items.find((rule) => rule.ruleId === ruleId);

    if (match !== undefined) {
      setSimulateForRule(match);
    }

    document
      .querySelector(`[data-alert-rule-id="${ruleId}"]`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

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
  const showCreateForm = scopedRunFilterActive && (canEdit || !isEmpty);
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

  const thresholdConfigured =
    ruleType === "RejectedSecurityRecommendation" ||
    (Number.isFinite(threshold) && threshold > 0 && fieldErrors.thresholdValue === undefined);
  const alertRulesCreateSteps = resolveAlertRulesCreateSteps({
    signalConfigured: name.trim().length > 0,
    thresholdConfigured,
    ruleEnabled: items.some((rule) => rule.isEnabled === true),
  });
  const alertRulesCreateEmphasizedStepId = resolveAlertRulesCreateEmphasizedStepId({
    signalConfigured: name.trim().length > 0,
    thresholdConfigured,
    ruleEnabled: items.some((rule) => rule.isEnabled === true),
  });

  const emptyStateFooter = canEdit && scopedRunFilterActive ? (
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

      {!scopedRunFilterActive ? (
        <AlertRulesPickReviewBeforeCreatingStrip selectedReviewId="" onSelectReview={onPickReviewForCreating} />
      ) : (
        <p
          className={cn("m-0 mb-4 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
          data-testid="alert-rules-run-scope-banner"
        >
          {"Creating rules scoped to review "}
          <span className="font-mono text-al-text-primary">{scopedRunId}</span>
          {" · "}
          <Link className={OPERATOR_BODY_INLINE_LINK_CLASS} href={governanceAlertRulesTabHref("rules")}>
            Clear review scope
          </Link>
          {" · "}
          <Link
            className={OPERATOR_BODY_INLINE_LINK_CLASS}
            href={`/architecture/reviews/${encodeURIComponent(scopedRunId)}`}
          >
            Open review
          </Link>
        </p>
      )}

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
          <AlertRulesTable
            listInitialLoading={listInitialLoading}
            items={items}
            continueLastRule={continueLastRule}
            routingSubscriptions={routingSubscriptions}
            showEmptyCard={showEmptyCard}
            emptyStateDescription={emptyStateDescription}
            emptyStateFooter={emptyStateFooter}
            onOpenRule={openRule}
            onSimulate={(selected) => {
              rememberRule(selected.ruleId);
              setSimulateForRule(selected);
            }}
          />

          {showCreateForm ? (
            <AlertRulesCreateForm
              canEdit={canEdit}
              loading={loading}
              creating={creating}
              formValid={formValid}
              fieldErrors={fieldErrors}
              fieldTouched={fieldTouched}
              setFieldTouched={setFieldTouched}
              name={name}
              setName={setName}
              ruleType={ruleType}
              setRuleType={setRuleType}
              alertPriority={alertPriority}
              setAlertPriority={setAlertPriority}
              threshold={threshold}
              setThreshold={setThreshold}
              thresholdStep={thresholdStep}
              nameInputRef={nameInputRef}
              alertRulesCreateSteps={alertRulesCreateSteps}
              alertRulesCreateEmphasizedStepId={alertRulesCreateEmphasizedStepId}
              mutationDisabledReason={mutationDisabledReason}
              mutationDisabledHintId={mutationDisabledHintId}
              onCreate={() => {
                void onCreate();
              }}
            />
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

      {scopedRunFilterActive ? <AlertRulesNextReviewFooterClient runId={scopedRunId} /> : null}
    </div>
  );
}
