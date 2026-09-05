"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";

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
  shouldPinLivePreviewReadinessRail,
} from "@/lib/operator/operator-live-preview-readiness-rail";
import {
  ALERT_RULES_CREATE_BUTTON_LABEL,
  ALERT_RULES_CREATE_SUCCESS_MESSAGE,
  ALERT_RULES_LIST_EMPTY_BODY,
  ALERT_RULES_NOTIFICATION_EXTERNAL_NOT_CONFIGURED,
  ALERT_RULES_NOTIFICATIONS_TAB_LINK_LABEL,
} from "@/lib/alert-rule-conditions-copy";
import { latestAlertRulesConfigChange } from "@/lib/alert-rules-config-change";
import {
  resolveAlertRulesCreateEmphasizedStepId,
  resolveAlertRulesCreateSteps,
} from "@/lib/alert-rules-create-checklist";
import { isBuyerPolishedOperatorShellEnv, isOperatorExperienceFullShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_BODY_INLINE_LINK_CLASS } from "@/lib/design-tokens";
import { governanceAlertRulesTabHref, GOVERNANCE_ALERT_RULES_PATH } from "@/lib/governance/governance-route-paths";
import { whyDisabledEnterpriseMutationControl } from "@/lib/why-disabled-cta";
import { useOptionalAlertRulesHubRefresh } from "@/lib/alerts-hub-refresh-context";
import { useOperateCapability } from "@/hooks/use-operate-capability";
import { readOperatorScopeFromStorage } from "@/lib/operator/operator-scope-storage";
import type { AlertRule } from "@/types/alerts";
import {
  resolveContinueLastAlertRule,
  writeAlertRuleLastViewedId,
} from "@/lib/resolve-continue-last-alert-rule";
import {
  compositeAlertRulesPanelsHrefFromSearch,
  parseCompositeAlertRulesCreatePanelFromSearch,
} from "@/lib/alerts/composite-alert-rules-panels-url";
import {
  alertRulesSimulateRuleHrefFromSearch,
  parseAlertRulesSimulateRuleIdFromSearch,
} from "@/lib/alerts/alert-rules-simulate-rule-url";
import { MutatingInWorkspaceChip } from "@/components/MutatingInWorkspaceChip";
import { Button } from "@/components/ui/button";

export function useAlertRulesContentState() {
  const router = useRouter();
  const pathname = usePathname() ?? GOVERNANCE_ALERT_RULES_PATH;
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
  const urlShowCreate = parseCompositeAlertRulesCreatePanelFromSearch(searchParams.get("create"));
  const [showCreatePanel, setShowCreatePanelState] = useState(urlShowCreate);
  const [creating, setCreating] = useState(false);
  const [mutationFailure, setMutationFailure] = useState<ApiLoadFailureState | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const items = rulesQuery.items;
  const continueLastRule = useMemo(() => resolveContinueLastAlertRule(items), [items]);
  const routingSubscriptions = routingQuery.items;
  const loading = rulesQuery.loading;
  const failure = rulesQuery.failure ?? mutationFailure;
  const [simulateForRule, setSimulateForRuleState] = useState<AlertRule | null>(null);

  const syncSimulateRuleToUrl = useCallback(
    (rule: AlertRule | null) => {
      router.replace(
        alertRulesSimulateRuleHrefFromSearch(searchParams.toString(), rule?.ruleId ?? null, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setSimulateForRule = useCallback(
    (rule: AlertRule | null) => {
      setSimulateForRuleState(rule);
      syncSimulateRuleToUrl(rule);
    },
    [syncSimulateRuleToUrl],
  );

  useEffect(() => {
    const simulateRuleId = parseAlertRulesSimulateRuleIdFromSearch(searchParams.get("simulateRule"));

    if (simulateRuleId.length === 0) {
      setSimulateForRuleState(null);

      return;
    }

    if (loading) {
      return;
    }

    const match = items.find((rule) => rule.ruleId === simulateRuleId);

    if (match === undefined) {
      return;
    }

    setSimulateForRuleState((current) => (current?.ruleId === match.ruleId ? current : match));
  }, [items, loading, searchParams]);

  const syncCreatePanelToUrl = useCallback(
    (showCreate: boolean) => {
      router.replace(compositeAlertRulesPanelsHrefFromSearch(searchParams.toString(), { showCreatePanel: showCreate }), {
        scroll: false,
      });
    },
    [router, searchParams],
  );

  const setShowCreatePanel = useCallback(
    (next: boolean | ((prev: boolean) => boolean)) => {
      setShowCreatePanelState((prev) => {
        const resolved = typeof next === "function" ? next(prev) : next;
        syncCreatePanelToUrl(resolved);

        return resolved;
      });
    },
    [syncCreatePanelToUrl],
  );

  useEffect(() => {
    setShowCreatePanelState(parseCompositeAlertRulesCreatePanelFromSearch(searchParams.get("create")));
  }, [searchParams]);

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
  const emptyIntroMode = scopedRunFilterActive && isEmpty && canEdit && !showCreatePanel && !loading;
  const showCreateForm = scopedRunFilterActive && (!canEdit || showCreatePanel || !isEmpty);
  const sectionGap = pinLivePreviewRail ? "gap-8" : "gap-4";

  const emptyStateDescription = useMemo((): ReactNode => {
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

  const emptyStateFooter =
    canEdit && scopedRunFilterActive && emptyIntroMode ? (
      <div className="flex flex-wrap items-center gap-2" data-testid="alert-rules-empty-footer">
        <Button
          type="button"
          variant="primary"
          data-testid="alert-rules-create-action"
          onClick={() => setShowCreatePanel(true)}
        >
          {ALERT_RULES_CREATE_BUTTON_LABEL}
        </Button>
        <MutatingInWorkspaceChip />
      </div>
    ) : null;

  return {
    scopedRunId,
    scopedRunFilterActive,
    onPickReviewForCreating,
    sampleModeBlocked,
    statusRegionId,
    statusMessage,
    failure,
    canEdit,
    items,
    continueLastRule,
    routingSubscriptions,
    listInitialLoading,
    showEmptyCard,
    emptyIntroMode,
    showCreateForm,
    sectionGap,
    pinLivePreviewRail,
    emptyStateDescription,
    emptyStateFooter,
    openRule,
    rememberRule,
    simulateForRule,
    setSimulateForRule,
    creating,
    loading,
    formValid,
    fieldErrors,
    fieldTouched,
    setFieldTouched,
    name,
    setName,
    ruleType,
    setRuleType,
    alertPriority,
    setAlertPriority,
    threshold,
    setThreshold,
    thresholdStep,
    nameInputRef,
    alertRulesCreateSteps,
    alertRulesCreateEmphasizedStepId,
    mutationDisabledReason,
    mutationDisabledHintId,
    onCreate,
    formInput,
    scopePreviewRule,
    draftReadinessRule,
  };
}

export type AlertRulesContentViewModel = ReturnType<typeof useAlertRulesContentState>;
