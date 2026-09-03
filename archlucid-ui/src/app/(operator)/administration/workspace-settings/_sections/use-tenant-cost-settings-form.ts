"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";

import { useTenantCostSettingsQuery } from "@/hooks/use-tenant-cost-settings-query";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import { saveTenantCostSettings } from "@/lib/tenant-cost-settings-client";
import {
  resolveTenantCostSettingsSaveEmphasizedStepId,
  resolveTenantCostSettingsSaveSteps,
} from "@/lib/tenant-cost-settings-save-checklist";
import { validateTenantCostSettingsFields } from "@/lib/tenant-cost-settings-validation";
import type { TenantCostSettingsPutRequest, TenantCostSettingsResponse } from "@/types/tenant-cost-settings";

function applyLoadedSettingsToForm(
  data: TenantCostSettingsResponse,
  setters: {
    readonly setIsTenantConfigured: (value: boolean) => void;
    readonly setUpdatedUtc: (value: string | null) => void;
    readonly setHourlyRate: (value: string) => void;
    readonly setIncidentCost: (value: string) => void;
    readonly setEaDiscountPercentage: (value: string) => void;
  },
): void {
  setters.setIsTenantConfigured(data.isTenantConfigured);
  setters.setUpdatedUtc(data.updatedUtc);
  setters.setHourlyRate(String(data.architectHourlyRateUsd));
  setters.setIncidentCost(String(data.averageIncidentCostUsd));
  setters.setEaDiscountPercentage(String(data.eaDiscountPercentage ?? 0));
}

export type UseTenantCostSettingsFormOptions = {
  readonly canEdit: boolean;
};

/** Form state, validation, save mutation, and save-checklist resolution for tenant cost settings. */
export function useTenantCostSettingsForm({ canEdit }: UseTenantCostSettingsFormOptions) {
  const demoMode = isNextPublicDemoMode();
  const queryClient = useQueryClient();
  const costSettingsQuery = useTenantCostSettingsQuery({ enabled: !demoMode });

  const [saving, setSaving] = useState(false);
  const [isTenantConfigured, setIsTenantConfigured] = useState(false);
  const [updatedUtc, setUpdatedUtc] = useState<string | null>(null);
  const [hourlyRate, setHourlyRate] = useState("");
  const [incidentCost, setIncidentCost] = useState("");
  const [eaDiscountPercentage, setEaDiscountPercentage] = useState("0");
  const [saveConfirmation, setSaveConfirmation] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const fieldValidation = useMemo(
    () => validateTenantCostSettingsFields(hourlyRate, incidentCost, eaDiscountPercentage),
    [eaDiscountPercentage, hourlyRate, incidentCost],
  );

  useEffect(() => {
    if (costSettingsQuery.data === undefined) {
      return;
    }

    applyLoadedSettingsToForm(costSettingsQuery.data, {
      setIsTenantConfigured,
      setUpdatedUtc,
      setHourlyRate,
      setIncidentCost,
      setEaDiscountPercentage,
    });
  }, [costSettingsQuery.data]);

  const saveMutation = useMutation({
    mutationFn: saveTenantCostSettings,
    onSuccess: async (saved) => {
      applyLoadedSettingsToForm(saved, {
        setIsTenantConfigured,
        setUpdatedUtc,
        setHourlyRate,
        setIncidentCost,
        setEaDiscountPercentage,
      });
      setSaveConfirmation("Cost settings saved.");
      setSaveError(null);
      await queryClient.setQueryData(operatorQueryKeys.tenantCostSettings, saved);
    },
    onError: (error: unknown) => {
      setSaveError(toApiLoadFailure(error).message);
      setSaveConfirmation(null);
    },
    onSettled: () => {
      setSaving(false);
    },
  });

  const onSave = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();

      if (!canEdit || demoMode || !fieldValidation.valid) {
        return;
      }

      const architectHourlyRateUsd = Number(hourlyRate.trim());
      const averageIncidentCostUsd = Number(incidentCost.trim());
      const eaDiscountPct = Number(eaDiscountPercentage.trim());

      const body: TenantCostSettingsPutRequest = {
        architectHourlyRateUsd,
        averageIncidentCostUsd,
        eaDiscountPercentage: eaDiscountPct,
      };

      setSaving(true);
      setSaveConfirmation(null);
      setSaveError(null);
      saveMutation.mutate(body);
    },
    [canEdit, demoMode, eaDiscountPercentage, fieldValidation.valid, hourlyRate, incidentCost, saveMutation],
  );

  const loadFailure =
    costSettingsQuery.isError ? toApiLoadFailure(costSettingsQuery.error).message : null;
  const loading = costSettingsQuery.isPending;

  const helperCopy = isTenantConfigured
    ? "These values are used to estimate review savings and sponsor ROI when actual cost evidence is unavailable."
    : "These values are used to estimate review savings and sponsor ROI when actual cost evidence is unavailable. Showing platform defaults until you save.";

  const saveChecklistInput = {
    fieldsValid: fieldValidation.valid,
    saveComplete: saveConfirmation !== null,
  };
  const saveSteps = resolveTenantCostSettingsSaveSteps(saveChecklistInput);
  const saveEmphasizedStepId = resolveTenantCostSettingsSaveEmphasizedStepId(saveChecklistInput);

  return {
    demoMode,
    canEdit,
    costSettingsQuery,
    saving,
    isTenantConfigured,
    updatedUtc,
    hourlyRate,
    setHourlyRate,
    incidentCost,
    setIncidentCost,
    eaDiscountPercentage,
    setEaDiscountPercentage,
    saveConfirmation,
    setSaveConfirmation,
    saveError,
    fieldValidation,
    onSave,
    loadFailure,
    loading,
    helperCopy,
    saveSteps,
    saveEmphasizedStepId,
  };
}

export type TenantCostSettingsFormState = ReturnType<typeof useTenantCostSettingsForm>;
