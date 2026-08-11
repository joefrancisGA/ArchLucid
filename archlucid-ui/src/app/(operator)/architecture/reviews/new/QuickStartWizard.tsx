"use client";

import { cn } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";
import { useFormContext } from "react-hook-form";

import { LlmMonthlyBudgetExceededBanner } from "@/components/LlmMonthlyBudgetExceededBanner";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { ReviewStartInlineError } from "@/components/review-intake/ReviewStartInlineError";
import { ReviewStartStagedProgress } from "@/components/review-intake/ReviewStartStagedProgress";
import { ReviewStartUnresolvedNotice } from "@/components/review-intake/ReviewStartUnresolvedNotice";
import { WizardNavButtons } from "@/components/wizard/WizardNavButtons";
import { PilotModePolicyPackToggle } from "@/components/wizard/PilotModePolicyPackToggle";
import { WizardStepDescription } from "@/components/wizard/steps/WizardStepDescription";
import { WizardStepIdentity } from "@/components/wizard/steps/WizardStepIdentity";
import { WizardStepReview } from "@/components/wizard/steps/WizardStepReview";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { LlmMonthlyDollarBudgetStatus } from "@/hooks/use-llm-monthly-budget-execution-gate";
import { useReviewCreationProgress } from "@/hooks/use-review-creation-progress";
import { architectureReviewTemplates, suggestedSystemNameFromTemplateId } from "@/data/review-templates";
import { isApiRequestError } from "@/lib/api-request-error";
import { BUYER_START_ARCHITECTURE_REVIEW_CTA } from "@/lib/buyer-polish-copy";
import { isOperatorExperienceFullShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_SHELL_CONTENT_BLEED_X_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  REVIEW_START_PREPARING_LABEL,
  REVIEW_START_STEP_VALIDATION_MESSAGE,
} from "@/lib/review-start-progress-copy";
import { submitQuickFamilyWizardCreateRun } from "@/lib/wizard-form-create-run-submit";
import { resolveWizardPresetDeeplinkTokenFromPresetId } from "@/lib/wizard-preset-deeplink";
import { applyWizardPreset, wizardPresets, type WizardPreset } from "@/lib/wizard-presets";
import type { ReviewIntakeExampleTemplate } from "@/lib/operator-home-example-request";
import { buildDefaultWizardValues, type WizardFormValues } from "@/lib/wizard-schema";
import { WIZARD_STEP_FIELD_GROUPS } from "@/lib/wizard-step-fields";
import { trackWizardStepViewed, trackWizardValidationFailed } from "@/lib/telemetry";

const QUICK_STEPS = [
  { label: "System & preset", description: "Name your system and pick a starter profile" },
  { label: "Architecture brief", description: "Goals and scope (min. 10 characters)" },
  { label: "Review & submit", description: "Confirm defaults and create the request" },
] as const;

export type QuickStartWizardProps = {
  /** Monthly LLM dollar gate from parent (shared fetch with full wizard shell). */
  llmBudgetStatus: LlmMonthlyDollarBudgetStatus | null;
  blocksLlmExecution: boolean;
  /** Optional preset id from `?preset=` deep link (see `wizard-preset-deeplink.ts`). */
  initialPresetId?: string;
  /** Example template from `?template=` / legacy `?example=` — overrides preset brief and system name once. */
  exampleTemplate?: ReviewIntakeExampleTemplate | null;
  /** Invoked after a run id is returned so the parent can show pipeline tracking. */
  onRunCreated: (runId: string) => void;
};

/**
 * Three-step wizard that maps to the same `ArchitectureRequest` payload as the full wizard, using preset defaults
 * for constraints and advanced fields.
 */
export function QuickStartWizard(props: QuickStartWizardProps) {
  const { onRunCreated, llmBudgetStatus, blocksLlmExecution } = props;
  const [quickStep, setQuickStep] = useState(0);
  const [focusedPilotModeEnabled, setFocusedPilotModeEnabled] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<unknown | null>(null);
  const [stepValidationMessage, setStepValidationMessage] = useState<string | null>(null);
  const creationProgress = useReviewCreationProgress();
  const [presetId, setPresetId] = useState<string>(() => {
    if (props.initialPresetId !== undefined && wizardPresets.some((entry) => entry.id === props.initialPresetId)) {
      return props.initialPresetId;
    }

    return "greenfield-web-app";
  });

  const { trigger, getValues, reset, setValue, clearErrors } = useFormContext<WizardFormValues>();

  const selectedPreset: WizardPreset | undefined = useMemo(
    () => wizardPresets.find((p) => p.id === presetId),
    [presetId],
  );

  useEffect(() => {
    const preset = wizardPresets.find((p) => p.id === presetId);

    if (!preset) {
      return;
    }

    const merged = applyWizardPreset(buildDefaultWizardValues(), preset.values);

    if (props.exampleTemplate !== null && props.exampleTemplate !== undefined) {
      merged.description = props.exampleTemplate.briefText;
      merged.systemName = props.exampleTemplate.systemName;
    }

    reset(merged);
  }, [presetId, props.exampleTemplate, reset]);

  useEffect(() => {
    trackWizardStepViewed(quickStep, QUICK_STEPS[quickStep]?.label ?? "Unknown", "QuickStart");
    if (quickStep !== 2) {
      setSubmitError(null);
    }

    setStepValidationMessage(null);
  }, [quickStep]);

  const isCreating = submitting || creationProgress.isActive;
  const canProceed = !isCreating;
  const canSubmit = !isCreating && !blocksLlmExecution;

  const applyReviewTemplate = (templateId: string) => {
    const template = architectureReviewTemplates.find((t) => t.id === templateId);

    if (!template) {
      return;
    }

    clearErrors(["description", "systemName"]);
    setValue("description", template.briefText, { shouldValidate: true, shouldDirty: true });
    setValue("systemName", suggestedSystemNameFromTemplateId(template.id), {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const goBack = () => {
    setQuickStep((s) => Math.max(0, s - 1));
  };

  const goNext = async () => {
    const fieldGroup = quickStep <= 1 ? WIZARD_STEP_FIELD_GROUPS[2] : null;

    if (fieldGroup != null) {
      // Trigger validation for only the fields on this step
      const ok = await trigger(fieldGroup, { shouldFocus: true });
      if (!ok) {
        trackWizardValidationFailed(
          "QuickStart",
          quickStep,
          QUICK_STEPS[quickStep]?.label ?? "Unknown",
          "field_validation",
        );
        setStepValidationMessage(REVIEW_START_STEP_VALIDATION_MESSAGE);

        return;
      }
    }

    setStepValidationMessage(null);
    setQuickStep((s) => Math.min(QUICK_STEPS.length - 1, s + 1));
  };

  const submitRun = async () => {
    const presetToken = resolveWizardPresetDeeplinkTokenFromPresetId(presetId);

    await submitQuickFamilyWizardCreateRun({
      trigger,
      getValues,
      blocksLlmExecution,
      payloadOptions: {
        requestSource: "wizard",
        wizardPresetUsed: presetToken ?? undefined,
        focusedPilotModeEnabled,
      },
      wizardCompletedName: "QuickStart",
      setSubmitting,
      setSubmitError,
      setStepValidationMessage,
      onRunCreated,
      progress: creationProgress,
    });
  };

  const isReviewStep = quickStep === 2;
  const isFirstStep = quickStep === 0;

  return (
    <div className="space-y-4 pb-36">
      {isOperatorExperienceFullShellEnv() && llmBudgetStatus !== null ? (
        <LlmMonthlyBudgetExceededBanner status={llmBudgetStatus} />
      ) : null}
      <div className="space-y-1" data-testid="quick-start-progress">
        <p className="m-0 font-medium text-neutral-900 dark:text-neutral-100">
          Quick start — step {quickStep + 1} of {QUICK_STEPS.length}: {QUICK_STEPS[quickStep].label}
        </p>
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{QUICK_STEPS[quickStep].description}</p>
      </div>

      {quickStep === 0 ? (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Environment preset</CardTitle>
              <CardDescription>
                Applies default constraints and capability hints. You can fine-tune later from the full wizard.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={presetId} onValueChange={setPresetId}>
                <SelectTrigger aria-label="Environment preset" data-testid="quick-start-preset-select">
                  <SelectValue placeholder="Choose a preset" />
                </SelectTrigger>
                <SelectContent>
                  {wizardPresets.map((p) => (
                    <SelectItem key={p.id} value={p.id} data-testid={`quick-start-preset-${p.id}`}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
          {selectedPreset ? (
            <p className={cn(OPERATOR_TYPOGRAPHY.helper, "text-neutral-600 dark:text-neutral-400")} data-testid="quick-start-preset-caption">
              Using preset: <strong>{selectedPreset.label}</strong>
            </p>
          ) : null}
          <PilotModePolicyPackToggle
            enabled={focusedPilotModeEnabled}
            onEnabledChange={setFocusedPilotModeEnabled}
          />
          <WizardStepIdentity />
        </div>
      ) : null}
      {quickStep === 1 ? (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Start from a template</CardTitle>
              <CardDescription>
                One click fills the architecture brief (and a matching system name). Edit the textarea afterward if
                needed.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {architectureReviewTemplates.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    data-testid={`quick-start-template-${t.id}`}
                    aria-label={`Use template: ${t.name}`}
                    onClick={() => {
                      applyReviewTemplate(t.id);
                    }}
                    className={cn(
                      "flex flex-col items-start gap-1 rounded-lg border border-neutral-200/80 bg-white p-3 text-left shadow-sm transition hover:border-teal-600/45 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-950/40 dark:hover:border-teal-500/40 dark:hover:bg-neutral-900/60",
                      OPERATOR_TYPOGRAPHY.body,
                    )}
                  >
                    <span className="font-medium text-neutral-900 dark:text-neutral-100">{t.name}</span>
                    <span className={OPERATOR_TYPOGRAPHY.helper}>{t.description}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
          <WizardStepDescription />
        </div>
      ) : null}
      {quickStep === 2 ? <WizardStepReview /> : null}

      <div
        className={cn(
          "sticky bottom-0 z-10 mt-8 border-t border-neutral-200/60 bg-neutral-50/98 py-3 shadow-[0_-2px_8px_-2px_rgba(0,0,0,0.06)] backdrop-blur supports-[backdrop-filter]:bg-neutral-50/85 dark:border-neutral-800/60 dark:bg-neutral-950/98 dark:shadow-[0_-2px_8px_-2px_rgba(0,0,0,0.25)] dark:supports-[backdrop-filter]:bg-neutral-950/85",
          OPERATOR_SHELL_CONTENT_BLEED_X_CLASS,
        )}
        data-testid="quick-start-footer"
      >
        {creationProgress.showStagedPanel && creationProgress.activeStageId !== null ? (
          <div className="mb-3">
            <ReviewStartStagedProgress
              stages={creationProgress.stages}
              activeStageId={creationProgress.activeStageId}
              headline={REVIEW_START_PREPARING_LABEL}
              detail={creationProgress.waitCopy?.detail ?? null}
              testId="quick-start-review-start-progress"
            />
          </div>
        ) : null}

        {creationProgress.outcome?.kind === "unresolved" ? (
          <div className="mb-3">
            <ReviewStartUnresolvedNotice
              onRecheck={() => {
                void submitRun();
              }}
              isRechecking={creationProgress.isActive}
              testId="quick-start-unresolved-notice"
            />
          </div>
        ) : null}

        {stepValidationMessage !== null ? (
          <div className="mb-3" data-testid="quick-start-validation-error">
            <ReviewStartInlineError message={stepValidationMessage} />
          </div>
        ) : null}
        {isReviewStep && submitError !== null ? (
          <div className="mb-3" data-testid="quick-start-submit-error">
            {isApiRequestError(submitError) ? (
              <OperatorApiProblem
                problem={submitError.problem}
                fallbackMessage={submitError.message}
                correlationId={submitError.correlationId}
                httpStatus={submitError.httpStatus}
                retryAfterSeconds={submitError.retryAfterSeconds}
              />
            ) : (
              <OperatorApiProblem
                problem={null}
                fallbackMessage={
                  submitError && typeof submitError === "object" && "message" in submitError
                    ? String((submitError as { message?: string }).message)
                    : "Request failed."
                }
              />
            )}
          </div>
        ) : null}
        <WizardNavButtons
          onBack={goBack}
          onNext={isReviewStep ? undefined : goNext}
          onSubmit={isReviewStep ? submitRun : undefined}
          onSaveDraft={undefined}
          submitting={isCreating}
          canProceed={canProceed}
          canSubmit={canSubmit}
          isFirstStep={isFirstStep}
          isLastInputStep={isReviewStep}
          nextLabel="Next"
          submitLabel={BUYER_START_ARCHITECTURE_REVIEW_CTA}
          submittingLabel="Creating…"
        />
      </div>
    </div>
  );
}
