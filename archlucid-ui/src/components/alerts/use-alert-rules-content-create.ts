"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";

import { useLivelihoodDocumentGuards } from "@/hooks/use-livelihood-document-guards";
import { createAlertRule } from "@/lib/api";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import {
  ALERT_RULE_FORM_DEFAULT_DRAFT,
  alertRuleFormDiffersFromDefaultDraft,
  isAlertRuleFormValid,
  validateAlertRuleForm,
  usesIntegerThreshold,
  type AlertRuleFormInput,
} from "@/lib/alert-rule-conditions";
import {
  ALERT_RULES_CREATE_SUCCESS_MESSAGE,
} from "@/lib/alert-rule-conditions-copy";
import {
  resolveAlertRulesCreateEmphasizedStepId,
  resolveAlertRulesCreateSteps,
} from "@/lib/alert-rules-create-checklist";
import {
  compositeAlertRulesPanelsHrefFromSearch,
  parseCompositeAlertRulesCreatePanelFromSearch,
} from "@/lib/alerts/composite-alert-rules-panels-url";
import { whyDisabledEnterpriseMutationControl } from "@/lib/why-disabled-cta";
import type { AlertRule } from "@/types/alerts";

export type UseAlertRulesContentCreateInput = {
  readonly canEdit: boolean;
  readonly canMutateAlertRules: boolean;
  readonly items: readonly AlertRule[];
  readonly loading: boolean;
  readonly scopedRunFilterActive: boolean;
  readonly isEmpty: boolean;
  readonly load: () => Promise<void>;
  readonly didFocusEmptyIntroRef: MutableRefObject<boolean>;
};

export function useAlertRulesContentCreate({
  canEdit,
  canMutateAlertRules,
  items,
  loading,
  scopedRunFilterActive,
  isEmpty,
  load,
  didFocusEmptyIntroRef,
}: UseAlertRulesContentCreateInput) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlShowCreate = parseCompositeAlertRulesCreatePanelFromSearch(searchParams.get("create"));
  const createInFlightRef = useRef(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const [showCreatePanel, setShowCreatePanelState] = useState(urlShowCreate);
  const [creating, setCreating] = useState(false);
  const [mutationFailure, setMutationFailure] = useState<ApiLoadFailureState | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

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
  const formDirty = alertRuleFormDiffersFromDefaultDraft(formInput);
  const thresholdStep = usesIntegerThreshold(ruleType) ? 1 : 0.1;

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

  useEffect(() => {
    if (!canEdit || didFocusEmptyIntroRef.current || loading || items.length > 0) {
      return;
    }

    didFocusEmptyIntroRef.current = true;
    nameInputRef.current?.focus();
  }, [canEdit, didFocusEmptyIntroRef, items.length, loading]);

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

  const mutationDisabledReason = canMutateAlertRules ? null : whyDisabledEnterpriseMutationControl();
  const mutationDisabledHintId = "alert-rules-mutate-disabled-hint";

  const emptyIntroMode = scopedRunFilterActive && isEmpty && canEdit && !showCreatePanel && !loading;
  const showCreateForm = scopedRunFilterActive && (!canEdit || showCreatePanel || !isEmpty);
  const documentGuards = useLivelihoodDocumentGuards({ when: formDirty && showCreateForm });

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

  return {
    creating,
    mutationFailure,
    statusMessage,
    name,
    setName,
    ruleType,
    setRuleType,
    alertPriority,
    setAlertPriority,
    threshold,
    setThreshold,
    fieldTouched,
    setFieldTouched,
    formInput,
    formValid,
    fieldErrors,
    thresholdStep,
    nameInputRef,
    onCreate,
    mutationDisabledReason,
    mutationDisabledHintId,
    emptyIntroMode,
    showCreateForm,
    setShowCreatePanel,
    documentGuards,
    alertRulesCreateSteps,
    alertRulesCreateEmphasizedStepId,
    formDirty,
  };
}
