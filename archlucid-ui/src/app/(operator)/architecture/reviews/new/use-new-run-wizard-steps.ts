"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo } from "react";
import type { UseFormTrigger } from "react-hook-form";

import { useWizardStepNavigation } from "@/hooks/use-wizard-step-navigation";
import {
  clampWizardStepIndex,
  nextWizardStepIndex,
  previousWizardStepIndex,
} from "@/lib/wizard-step-sequence";
import {
  newRunWizardStepHrefFromSearch,
  parseNewRunWizardStepFromSearch,
} from "@/lib/runs/new-run-wizard-step-url";
import {
  resolveNewRunWizardCompleteSetupEmphasizedStepId,
  resolveNewRunWizardCompleteSetupSteps,
} from "@/lib/new-run-wizard-complete-setup-checklist";
import { REVIEW_START_STEP_VALIDATION_MESSAGE } from "@/lib/review-start-progress-copy";
import {
  getWizardStepFieldGroup,
  FULL_WIZARD_BASELINE_METRICS_STEP_INDEX,
} from "@/lib/wizard-step-fields";
import type { WizardFormValues } from "@/lib/wizard-schema";
import { trackWizardValidationFailed } from "@/lib/telemetry";
import { shouldShowWizardModeToggle } from "@/lib/core-pilot-step-presentation";
import type { CorePilotCommitPresentationContext } from "@/lib/core-pilot-step-presentation";

import {
  REVIEW_STEP_INDEX,
  TRACK_STEP_INDEX,
  WIZARD_STEP_DEFINITIONS_BASELINE,
  WIZARD_STEP_DEFINITIONS_FULL,
  macroCompletedSteps,
  macroWizardStepIndex,
} from "./new-run-wizard-steps";

export type UseNewRunWizardStepsOptions = {
  readonly baselineFirst: boolean;
  readonly embeddedInPathSwitcher: boolean;
  readonly wizardMode: "quick" | "full";
  readonly runId: string | null;
  readonly showQuickTrack: boolean;
  readonly commitPresentationContext: CorePilotCommitPresentationContext;
  readonly advancedConfigurationOptIn: boolean;
  readonly watchedWizardValues: WizardFormValues | undefined;
  readonly hasPendingEvidence: boolean;
  readonly trigger: UseFormTrigger<WizardFormValues>;
  readonly persistBaselineMetricsIfNeeded: () => Promise<boolean>;
  readonly setStepValidationMessage: (message: string | null) => void;
};

export function useNewRunWizardSteps(options: UseNewRunWizardStepsOptions) {
  const router = useRouter();
  const pathname = usePathname() ?? "/architecture/reviews/new";
  const searchParams = useSearchParams();
  const urlStepIndex = parseNewRunWizardStepFromSearch(searchParams.get("step"));

  const stepDefinitions = options.baselineFirst
    ? WIZARD_STEP_DEFINITIONS_BASELINE
    : WIZARD_STEP_DEFINITIONS_FULL;

  const { stepIndex, setStepIndex, goBack, goToStep, advance, isFirstStep, isReviewStep } =
    useWizardStepNavigation({
      steps: stepDefinitions,
      telemetryWizardName: "FullGuided",
      reviewStepIndex: REVIEW_STEP_INDEX,
      initialStepIndex: urlStepIndex ?? 0,
    });

  const syncStepToUrl = useCallback(
    (nextStepIndex: number) => {
      router.replace(newRunWizardStepHrefFromSearch(searchParams.toString(), nextStepIndex, pathname), {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const setStepIndexWithUrl = useCallback(
    (value: React.SetStateAction<number>) => {
      setStepIndex((current) => {
        const resolved = typeof value === "function" ? value(current) : value;
        syncStepToUrl(resolved);

        return resolved;
      });
    },
    [setStepIndex, syncStepToUrl],
  );

  const goToStepWithUrl = useCallback(
    (index: number) => {
      goToStep(index);
      syncStepToUrl(index);
    },
    [goToStep, syncStepToUrl],
  );

  const goBackWithUrl = useCallback(() => {
    setStepIndex((current) => {
      const next = previousWizardStepIndex(current);
      syncStepToUrl(next);

      return next;
    });
  }, [setStepIndex, syncStepToUrl]);

  const advanceWithUrl = useCallback(() => {
    setStepIndex((current) => {
      const next = nextWizardStepIndex(current, stepDefinitions.length);
      syncStepToUrl(next);

      return next;
    });
  }, [setStepIndex, stepDefinitions.length, syncStepToUrl]);

  useEffect(() => {
    const nextStep = parseNewRunWizardStepFromSearch(searchParams.get("step"));

    if (nextStep === null) {
      return;
    }

    goToStep(clampWizardStepIndex(nextStep, stepDefinitions.length));
  }, [goToStep, searchParams, stepDefinitions.length]);

  const macroStep: number = macroWizardStepIndex(stepIndex);
  const completedMacroSteps: number[] = macroCompletedSteps(stepIndex);
  const wizardCompleteSetupSteps = resolveNewRunWizardCompleteSetupSteps({
    identityConfigured: stepIndex >= 2 && (options.watchedWizardValues?.systemName?.trim().length ?? 0) > 0,
    evidenceConfigured: stepIndex > 1 || options.hasPendingEvidence,
    reviewStarted: options.runId !== null,
  });
  const wizardCompleteSetupEmphasizedStepId = resolveNewRunWizardCompleteSetupEmphasizedStepId({
    identityConfigured: stepIndex >= 2 && (options.watchedWizardValues?.systemName?.trim().length ?? 0) > 0,
    evidenceConfigured: stepIndex > 1 || options.hasPendingEvidence,
    reviewStarted: options.runId !== null,
  });

  const goNext = useCallback(async () => {
    if (stepIndex === 0) {
      advanceWithUrl();

      return;
    }

    if (stepIndex === FULL_WIZARD_BASELINE_METRICS_STEP_INDEX) {
      const saved = await options.persistBaselineMetricsIfNeeded();

      if (!saved) {
        return;
      }

      advanceWithUrl();

      return;
    }

    const fieldGroup = getWizardStepFieldGroup(stepIndex, options.baselineFirst);

    if (fieldGroup != null) {
      const ok = await options.trigger(fieldGroup, { shouldFocus: true });

      if (!ok) {
        trackWizardValidationFailed(
          "FullGuided",
          stepIndex,
          stepDefinitions[stepIndex]?.label ?? "Unknown",
          "field_validation",
        );
        options.setStepValidationMessage(REVIEW_START_STEP_VALIDATION_MESSAGE);

        return;
      }
    }

    advanceWithUrl();
  }, [advanceWithUrl, options, stepDefinitions, stepIndex]);

  const showNav: boolean = stepIndex < TRACK_STEP_INDEX;
  const showSimplifiedPilotWizard = options.baselineFirst && options.wizardMode === "quick" && !options.showQuickTrack;
  const showQuickStartWizard = !options.baselineFirst && options.wizardMode === "quick" && !options.showQuickTrack;
  const effectiveShowFullWizardShell = options.wizardMode === "full" && !options.showQuickTrack;
  const showWizardModeToggle =
    !options.embeddedInPathSwitcher &&
    shouldShowWizardModeToggle(
      options.commitPresentationContext.hasCommittedManifest,
      options.advancedConfigurationOptIn,
    );
  const showFirstRunProgressBanner =
    !options.embeddedInPathSwitcher &&
    options.wizardMode === "quick" &&
    !options.showQuickTrack &&
    !options.commitPresentationContext.hasCommittedManifest;
  const showDetailedPathStepperChrome =
    effectiveShowFullWizardShell && !(options.embeddedInPathSwitcher && stepIndex === 0);
  const fullWizardStepCountLabel: number = stepDefinitions.length;
  const quickModeLabel = options.baselineFirst ? "Pilot baseline (4 steps)" : "Quick start (3 steps)";
  const showStepRecap =
    stepIndex >= 2 && stepIndex <= REVIEW_STEP_INDEX && !(options.baselineFirst && stepIndex === 1);

  const stepChrome = useMemo(
    () => ({
      showNav,
      showSimplifiedPilotWizard,
      showQuickStartWizard,
      effectiveShowFullWizardShell,
      showWizardModeToggle,
      showFirstRunProgressBanner,
      showDetailedPathStepperChrome,
      fullWizardStepCountLabel,
      quickModeLabel,
      showStepRecap,
    }),
    [
      effectiveShowFullWizardShell,
      fullWizardStepCountLabel,
      quickModeLabel,
      showDetailedPathStepperChrome,
      showFirstRunProgressBanner,
      showNav,
      showQuickStartWizard,
      showSimplifiedPilotWizard,
      showStepRecap,
      showWizardModeToggle,
    ],
  );

  return {
    stepDefinitions,
    stepIndex,
    setStepIndex: setStepIndexWithUrl,
    goBack: goBackWithUrl,
    goToStep: goToStepWithUrl,
    advance: advanceWithUrl,
    isFirstStep,
    isReviewStep,
    macroStep,
    completedMacroSteps,
    wizardCompleteSetupSteps,
    wizardCompleteSetupEmphasizedStepId,
    goNext,
    ...stepChrome,
  };
}
