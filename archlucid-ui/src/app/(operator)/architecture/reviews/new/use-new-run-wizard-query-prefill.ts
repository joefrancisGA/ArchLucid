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

function applyPolicyPackPrefill(
  deeplinkPolicyPackId: string | null,
  setValue: UseFormSetValue<WizardFormValues>,
): void {
  if (deeplinkPolicyPackId === null) {
    return;
  }

  setValue("policyReferences", [deeplinkPolicyPackId], { shouldValidate: true, shouldDirty: true });
}

/** Wholesale `reset` from session restore clears form state; re-apply policy-pack deeplinks the one-shot hook skipped. */
export function restoreWizardFormWithDeeplinkPolicy(
  deeplinkPolicyPackId: string | null,
  reset: UseFormReset<WizardFormValues>,
  setValue: UseFormSetValue<WizardFormValues>,
  values: WizardFormValues,
): void {
  reset(values);
  applyPolicyPackPrefill(deeplinkPolicyPackId, setValue);
}

/**
 * Applies link-borne prefills to the form: accelerator pack, preset deep link, zero-config demo
 * package, and example-request template.
 *
 * Accelerator, preset, policy, and demo links run at most once. Example templates apply again when
 * the template id changes, matching guided intake. Accelerator and preset links also force the full
 * wizard, because the fields they fill are only visible there.
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
    zeroConfigSelection,
  } = params;

  const zeroConfigAppliedRef = useRef(false);
  const exampleTemplateAppliedIdRef = useRef<string | null>(null);
  const policyPackPrefillAppliedRef = useRef(false);
  const acceleratorPrefillAppliedRef = useRef(false);
  const presetPrefillAppliedRef = useRef(false);

  useEffect(() => {
    if (deeplinkPolicyPackId === null || policyPackPrefillAppliedRef.current) {
      return;
    }

    policyPackPrefillAppliedRef.current = true;
    applyPolicyPackPrefill(deeplinkPolicyPackId, setValue);
  }, [deeplinkPolicyPackId, setValue]);

  useEffect(() => {
    if (acceleratorPackId === null || acceleratorPrefillAppliedRef.current) {
      return;
    }

    const preset = resolveAcceleratorWizardPreset(acceleratorPackId);

    if (preset === null) {
      return;
    }

    acceleratorPrefillAppliedRef.current = true;
    reset(applyWizardPreset(buildDefaultWizardValues(), preset));
    applyPolicyPackPrefill(deeplinkPolicyPackId, setValue);
    goToStep(1);

    if (!baselineFirst) {
      persistWizardMode("full");
    }
  }, [acceleratorPackId, baselineFirst, deeplinkPolicyPackId, goToStep, persistWizardMode, reset, setValue]);

  useEffect(() => {
    if (presetDeeplinkToken === null || presetDeeplinkPresetId === null || presetPrefillAppliedRef.current) {
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

    presetPrefillAppliedRef.current = true;
    reset(applyWizardPreset(buildDefaultWizardValues(), presetValues));
    applyPolicyPackPrefill(deeplinkPolicyPackId, setValue);
    goToStep(1);
    persistWizardMode("full");
  }, [
    acceleratorPackId,
    baselineFirst,
    deeplinkPolicyPackId,
    goToStep,
    persistWizardMode,
    presetDeeplinkPresetId,
    presetDeeplinkToken,
    reset,
    setValue,
  ]);

  useEffect(() => {
    if (exampleTemplate === null || wizardMode !== "full" || stepIndex !== 2) {
      return;
    }

    // A boolean latch drops a later sample opened on the same wizard. Guided intake keys this by id.
    if (exampleTemplateAppliedIdRef.current === exampleTemplate.id) {
      return;
    }

    exampleTemplateAppliedIdRef.current = exampleTemplate.id;
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
      zeroConfigSelection,
    );

    if (!applied.ok) {
      showToast("err", applied.message);

      return;
    }

    goToStep(2);
    const platformLabel =
      zeroConfigSelection.platform === "aws"
        ? "AWS"
        : zeroConfigSelection.platform === "gcp"
          ? "GCP"
          : "Azure";
    showToast("ok", `Demo ${platformLabel} package loaded — confirm identity and submit your review.`);
  }, [
    goToStep,
    onPendingEvidenceFileChange,
    persistWizardMode,
    setValue,
    showToast,
    zeroConfigDemo,
    zeroConfigSelection,
  ]);
}
