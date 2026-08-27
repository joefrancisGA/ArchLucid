"use client";

import { cn } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import { LlmMonthlyBudgetExceededBanner } from "@/components/llm/LlmMonthlyBudgetExceededBanner";
import { WizardNavButtons } from "@/components/wizard/WizardNavButtons";
import { ReviewAssuranceCoverageSection } from "@/components/wizard/ReviewAssuranceCoverageSection";
import { WizardStepHeading } from "@/components/wizard/WizardStepHeading";
import { WizardStickyFooter } from "@/components/wizard/WizardStickyFooter";
import { WizardStepDescription } from "@/components/wizard/steps/WizardStepDescription";
import { WizardStepIdentity } from "@/components/wizard/steps/WizardStepIdentity";
import { WizardStepReview } from "@/components/wizard/steps/WizardStepReview";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { LlmMonthlyDollarBudgetStatus } from "@/hooks/use-llm-monthly-budget-execution-gate";
import { useQuickFamilyWizardFlow } from "@/hooks/use-quick-family-wizard-flow";
import { architectureReviewTemplates, suggestedSystemNameFromTemplateId } from "@/data/review-templates";
import { BUYER_START_ARCHITECTURE_REVIEW_CTA } from "@/lib/buyer/buyer-polish-copy";
import { isOperatorExperienceFullShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { resolveWizardPresetDeeplinkTokenFromPresetId } from "@/lib/wizard-preset-deeplink";
import { applyWizardPreset, wizardPresets, type WizardPreset } from "@/lib/wizard-presets";
import type { ReviewIntakeExampleTemplate } from "@/lib/operator/operator-home-example-request";
import type { WizardCreateRunPayloadOptions } from "@/lib/wizard-payload";
import { buildDefaultWizardValues, type WizardFormValues } from "@/lib/wizard-schema";
import { WIZARD_STEP_FIELD_GROUPS } from "@/lib/wizard-step-fields";
import type { WizardStepDefinition, WizardStepFieldGroup } from "@/lib/wizard-step-sequence";

const QUICK_STEPS: readonly WizardStepDefinition[] = [
  { label: "System & preset", description: "Name your system and pick a starter profile" },
  { label: "Architecture brief", description: "Goals and scope (min. 10 characters)" },
  { label: "Review & submit", description: "Confirm defaults and create the request" },
];

const DEFAULT_QUICK_START_PRESET_ID = "greenfield-web-app";

/** Both input steps gate on the identity + description group (full-wizard step 2). */
function quickStartStepFieldGroup(stepIndex: number): WizardStepFieldGroup | null {
  if (stepIndex > 1) {
    return null;
  }

  return WIZARD_STEP_FIELD_GROUPS[2] ?? null;
}

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
  const [focusedPilotModeEnabled, setFocusedPilotModeEnabled] = useState(true);
  const [presetId, setPresetId] = useState<string>(() => {
    if (props.initialPresetId !== undefined && wizardPresets.some((entry) => entry.id === props.initialPresetId)) {
      return props.initialPresetId;
    }

    return DEFAULT_QUICK_START_PRESET_ID;
  });

  const { reset, setValue, clearErrors } = useFormContext<WizardFormValues>();
  const watchedValues = useWatch<WizardFormValues>();

  const hasExampleTemplate = props.exampleTemplate !== null && props.exampleTemplate !== undefined;

  const buildPayloadOptions = (): WizardCreateRunPayloadOptions => ({
    requestSource: "wizard",
    wizardPresetUsed: resolveWizardPresetDeeplinkTokenFromPresetId(presetId) ?? undefined,
    focusedPilotModeEnabled,
  });

  const flow = useQuickFamilyWizardFlow({
    steps: QUICK_STEPS,
    telemetryWizardName: "QuickStart",
    blocksLlmExecution,
    onRunCreated,
    resolveStepFieldGroup: quickStartStepFieldGroup,
    buildPayloadOptions,
    hasTemplate: hasExampleTemplate,
  });

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

  return (
    <div className="space-y-4 pb-36">
      {isOperatorExperienceFullShellEnv() && llmBudgetStatus !== null ? (
        <LlmMonthlyBudgetExceededBanner status={llmBudgetStatus} />
      ) : null}
      <WizardStepHeading
        wizardLabel="Quick start"
        stepIndex={flow.stepIndex}
        steps={QUICK_STEPS}
        testId="quick-start-progress"
      />

      {flow.stepIndex === 0 ? (
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
          <ReviewAssuranceCoverageSection
            focusedPilotModeEnabled={focusedPilotModeEnabled}
            onFocusedPilotModeEnabledChange={setFocusedPilotModeEnabled}
          />
          <WizardStepIdentity />
        </div>
      ) : null}
      {flow.stepIndex === 1 ? (
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
                      "flex flex-col items-start gap-1 rounded-lg border border-neutral-200/80 bg-white p-3 text-left shadow-sm transition hover:border-neutral-400 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-950/40 dark:hover:border-neutral-500 dark:hover:bg-neutral-900/60",
                      OPERATOR_TYPOGRAPHY.body,
                    )}
                  >
                    <span className={cn("text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}>
                      {t.name}
                    </span>
                    <span className={OPERATOR_TYPOGRAPHY.helper}>{t.description}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
          <WizardStepDescription />
        </div>
      ) : null}
      {flow.isReviewStep ? (
        <WizardStepReview focusedPilotModeEnabled={focusedPilotModeEnabled} />
      ) : null}

      <WizardStickyFooter
        testIdPrefix="quick-start"
        progress={flow.creationProgress}
        onRecheck={() => {
          void flow.recheckUnresolvedRun();
        }}
        stepValidationMessage={flow.stepValidationMessage}
        submitError={flow.submitError}
        showSubmitError={flow.isReviewStep}
      >
        <WizardNavButtons
          onBack={flow.goBack}
          onNext={flow.isReviewStep ? undefined : flow.goNext}
          onSubmit={flow.isReviewStep ? flow.submitRun : undefined}
          onSaveDraft={undefined}
          submitting={flow.isCreating}
          canProceed={flow.canProceed}
          canSubmit={flow.canSubmit}
          isFirstStep={flow.isFirstStep}
          isLastInputStep={flow.isReviewStep}
          nextLabel="Next"
          submitLabel={BUYER_START_ARCHITECTURE_REVIEW_CTA}
          submittingLabel="Creating…"
        />
      </WizardStickyFooter>
    </div>
  );
}
