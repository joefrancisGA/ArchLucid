"use client";

import { useEffect, useMemo, useState } from "react";

import { alertRuleFormDiffersFromDefaultDraft, resolveAlertRuleScopePreviewProjectId, type AlertRuleFormInput } from "@/lib/alert-rule-conditions";
import {
  hasAlertRulesLivePreviewPinContent,
  shouldPinLivePreviewReadinessRail,
} from "@/lib/operator/operator-live-preview-readiness-rail";
import { readOperatorScopeFromStorage } from "@/lib/operator/operator-scope-storage";
import type { AlertRule } from "@/types/alerts";
import type { AlertRoutingSubscription } from "@/types/alert-routing";

export type UseAlertRulesContentPreviewInput = {
  readonly items: readonly AlertRule[];
  readonly formInput: AlertRuleFormInput;
  readonly routingSubscriptions: readonly AlertRoutingSubscription[];
};

export function useAlertRulesContentPreview({
  items,
  formInput,
  routingSubscriptions,
}: UseAlertRulesContentPreviewInput) {
  const [sessionProjectId, setSessionProjectId] = useState<string | undefined>(undefined);

  useEffect(() => {
    setSessionProjectId(readOperatorScopeFromStorage()?.projectId);
  }, []);

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

  return {
    scopePreviewRule,
    draftReadinessRule,
    pinLivePreviewRail,
    routingSubscriptions,
    formInput,
  };
}
