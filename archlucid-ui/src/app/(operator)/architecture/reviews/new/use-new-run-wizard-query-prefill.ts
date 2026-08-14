"use client";

import { useEffect, useRef } from "react";
import type { UseFormReset, UseFormSetValue } from "react-hook-form";

import { resolveAcceleratorWizardPreset } from "@/lib/accelerator-wizard-presets";
import { applyWizardPreset } from "@/lib/wizard-presets";
import { resolveWizardPresetValuesFromDeeplink } from "@/lib/wizard-preset-deeplink";
import { buildDefaultWizardValues, type WizardFormValues } from "@/lib/wizard-schema";
import { applyBundledSamplePackageToWizard } from "@/lib/zero-config-demo-mode";

import type { NewRunWizardMode } from "./use-new-run-wizard-mode";
import type { NewRunWizardIntakeParams } from "./use-new-run-wizard-intake-params";

type QueryPrefillOptions = {
  readonly params: NewRunWizardIntakeParams;
  readonly stepIndex: number;
  readonly wizardMode: NewRunWizardMode;
  readonly reset: UseFormReset<WizardFormValues>;
  readonly setValue: UseFormSetValue<WizardFormValues>;
  readonly goToStep: (index: number) => void;
  readonly persistWizardMode: (mode: NewRunWizardMode) => void;
  readonly onPendingEvidenceFileChange: (file: File | null) => void;
  readonly showToast: (kind: "ok" | "err", message: string) => void;
};

/**
 * Applies link-borne prefills to the form: accelerator pack, preset deep link, zero-config demo
 * package, and example-request template.
 *
 * Each one runs at most once. Accelerator and preset links also force the full wizard, because the
 * fields they fill are only visible there.
 */
export function useNewRunWizardQueryPrefill(options: QueryPrefillOptions): void {
  const {
    goToStep,
    onPendingEvidenceFileChange,
    params,
    persistWizardMode,
    reset,
    setValue,
    showToast,
    stepIndex,
    wizardMode,
  } = options;

  const {
    acceleratorPackId,
    baselineFirst,
    deeplinkPolicyPackId,
    exampleTemplate,
    presetDeeplinkPresetId,
    presetDeeplinkToken,
    reviewIntakeCloudProvider,
    zeroConfigDemo,
    zeroConfigScenarioId,
  } = params;

  const zeroConfigAppliedRef = useRef(false);
  const exampleTemplatePrefillAppliedRef = useRef(false);
  const policyPackPrefillAppliedRef = useRef(false);

  useEffect(() => {
    if (deeplinkPolicyPackId === null || policyPackPrefillAppliedRef.current) {
      return;
    }

    policyPackPrefillAppliedRef.current = true;
    setValue("policyReferences", [deeplinkPolicyPackId], { shouldValidate: true, shouldDirty: true });
  }, [deeplinkPolicyPackId, setValue]);

  useEffect(() => {
    if (acceleratorPackId === null) {
      return;
    }

    const preset = resolveAcceleratorWizardPreset(acceleratorPackId);

    if (preset === null) {
      return;
    }

    reset(applyWizardPreset(buildDefaultWizardValues(), preset));
    goToStep(1);

    if (!baselineFirst) {
      persistWizardMode("full");
    }
  }, [acceleratorPackId, baselineFirst, goToStep, persistWizardMode, reset]);

  useEffect(() => {
    if (presetDeeplinkToken === null || presetDeeplinkPresetId === null) {
      return;
    }

    // An accelerator link is more specific than a preset link, and the pilot-baseline entry point
    // owns its own step sequence, so neither is overwritten here.
    if (baselineFirst || acceleratorPackId !== null) {
      return;
    }

    const presetValues = resolveWizardPresetValuesFromDeeplink(presetDeeplinkToken);

    if (presetValues === null) {
      return;
    }

    reset(applyWizardPreset(buildDefaultWizardValues(), presetValues));
    goToStep(1);
    persistWizardMode("full");
  }, [
    acceleratorPackId,
    baselineFirst,
    goToStep,
    persistWizardMode,
    presetDeeplinkPresetId,
    presetDeeplinkToken,
    reset,
  ]);

  useEffect(() => {
    if (exampleTemplate === null || wizardMode !== "full" || stepIndex !== 2) {
      return;
    }

    if (exampleTemplatePrefillAppliedRef.current) {
      return;
    }

    exampleTemplatePrefillAppliedRef.current = true;
    setValue("systemName", exampleTemplate.systemName, { shouldValidate: true, shouldDirty: true });
    setValue("description", exampleTemplate.briefText, { shouldValidate: true, shouldDirty: true });

    if (reviewIntakeCloudProvider !== null) {
      setValue("cloudProvider", reviewIntakeCloudProvider, { shouldValidate: true, shouldDirty: true });
    }
  }, [exampleTemplate, reviewIntakeCloudProvider, setValue, stepIndex, wizardMode]);

  useEffect(() => {
    if (!zeroConfigDemo || zeroConfigAppliedRef.current) {
      return;
    }

    zeroConfigAppliedRef.current = true;
    persistWizardMode("full");

    const applied = applyBundledSamplePackageToWizard(
      setValue,
      onPendingEvidenceFileChange,
      zeroConfigScenarioId,
    );

    if (!applied.ok) {
      showToast("err", applied.message);

      return;
    }

    goToStep(2);
    showToast("ok", "Demo Azure package loaded — confirm identity and submit your review.");
  }, [
    goToStep,
    onPendingEvidenceFileChange,
    persistWizardMode,
    setValue,
    showToast,
    zeroConfigDemo,
    zeroConfigScenarioId,
  ]);
}
