"use client";

import type { RefObject } from "react";

import { cn } from "@/lib/utils";

import { IntegrationConnectChecklist } from "@/components/integrations/IntegrationConnectChecklist";
import { CorePilotProgressTrackerBanner } from "@/components/usability/CorePilotProgressTrackerBanner";
import { ReviewIntakeExampleTemplateCallout } from "@/components/review-intake/ReviewIntakeExampleTemplateCallout";
import { WizardNavButtons } from "@/components/wizard/WizardNavButtons";
import { WizardSessionResumePrompt } from "@/components/wizard/WizardSessionResumePrompt";
import { WizardSessionSaveStatus } from "@/components/wizard/WizardSessionSaveStatus";
import { ReviewAssuranceCoverageSection } from "@/components/wizard/ReviewAssuranceCoverageSection";
import { WizardStepper } from "@/components/wizard/WizardStepper";
import { WizardStickyFooter } from "@/components/wizard/WizardStickyFooter";
import { WizardStepConstraints } from "@/components/wizard/steps/WizardStepConstraints";
import { WizardStepDescription } from "@/components/wizard/steps/WizardStepDescription";
import { WizardStepEvidenceUpload } from "@/components/wizard/steps/WizardStepEvidenceUpload";
import { WizardStepIdentity } from "@/components/wizard/steps/WizardStepIdentity";
import { WizardStepPreset } from "@/components/wizard/steps/WizardStepPreset";
import { WizardStepReview } from "@/components/wizard/steps/WizardStepReview";
import { LlmMonthlyBudgetExceededBanner } from "@/components/llm/LlmMonthlyBudgetExceededBanner";
import { LlmUsageBandHint } from "@/components/llm/LlmUsageBandHint";
import type { useWizardSessionPersistence } from "@/hooks/use-wizard-session-persistence";
import { BUYER_START_ARCHITECTURE_REVIEW_CTA } from "@/lib/buyer/buyer-polish-copy";
import { isBuyerPolishedOperatorShellEnv, isOperatorExperienceFullShellEnv } from "@/lib/demo-ui-env";
import type { AzureExtractorDemoScenarioId } from "@/lib/arch-lucid-azure-extractor-demo-scenarios";
import { OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { LlmMonthlyDollarBudgetStatus } from "@/lib/llm-monthly-budget-status";
import type { ReviewIntakeExampleTemplate } from "@/lib/operator/operator-home-example-request";
import type { WizardCreationProgressState } from "@/components/wizard/WizardCreationProgressNotices";
import type { WizardBaselineConfidence } from "@/lib/wizard-baseline-confidence";
import {
  FULL_WIZARD_BASELINE_METRICS_STEP_INDEX,
  FULL_WIZARD_EVIDENCE_STEP_INDEX,
} from "@/lib/wizard-step-fields";

import {
  ArchitectureRequestWizardHelpDrawer,
  QuickStartWizard,
  SimplifiedPilotWizard,
  WizardPostCreateEvidenceUploadPanel,
  WizardStepAdvanced,
  WizardStepCloudInventoryContext,
  WizardStepBaselineMetrics,
  WizardStepBaselineZip,
  WizardStepTrack,
} from "./NewRunWizardDeferredChunks";
import { NewRunWizardModeToggle } from "./NewRunWizardModeToggle";
import { NewRunWizardStepRecap } from "./NewRunWizardStepRecap";
import {
  MACRO_WIZARD_STEP_DEFINITIONS,
  REVIEW_STEP_INDEX,
  TRACK_STEP_INDEX,
  macroCompletedSteps,
  macroWizardStepIndex,
} from "./new-run-wizard-steps";
import type { useNewRunWizardPendingEvidence } from "./use-new-run-wizard-pending-evidence";

export type NewRunWizardStepBodyProps = {
  readonly embeddedInPathSwitcher: boolean;
  readonly followUpSourceRunId: string | null;
  readonly exampleTemplate: ReviewIntakeExampleTemplate | null;
  readonly showFirstRunProgressBanner: boolean;
  readonly wizardMode: "full" | "quick";
  readonly quickModeLabel: string;
  readonly fullWizardStepCountLabel: number;
  readonly showWizardModeToggle: boolean;
  readonly persistWizardMode: (mode: "full" | "quick") => void;
  readonly onAdvancedOptIn: () => void;
  readonly llmBudgetStatus: LlmMonthlyDollarBudgetStatus | null;
  readonly showQuickTrack: boolean;
  readonly postCreateEvidencePanel: React.ReactNode;
  readonly pipelineTrackPanel: React.ReactNode;
  readonly showSimplifiedPilotWizard: boolean;
  readonly blocksLlmExecution: boolean;
  readonly onRunCreated: (id: string) => void;
  readonly showQuickStartWizard: boolean;
  readonly presetDeeplinkPresetId: string | null;
  readonly presetDeeplinkToken: string | null;
  readonly showFullWizardShell: boolean;
  readonly templateWizardSession: ReturnType<typeof useWizardSessionPersistence>;
  readonly suppressWizardResumePrompt: boolean;
  readonly showDetailedPathStepperChrome: boolean;
  readonly macroStep: number;
  readonly stepIndex: number;
  readonly stepDefinitions: readonly { readonly label: string; readonly description: string }[];
  readonly completedMacroSteps: readonly number[];
  readonly wizardCompleteSetupSteps: ReturnType<
    typeof import("@/lib/new-run-wizard-complete-setup-checklist").resolveNewRunWizardCompleteSetupSteps
  >;
  readonly wizardCompleteSetupEmphasizedStepId: ReturnType<
    typeof import("@/lib/new-run-wizard-complete-setup-checklist").resolveNewRunWizardCompleteSetupEmphasizedStepId
  >;
  readonly showStepRecap: boolean;
  readonly baselineFirst: boolean;
  readonly featuredSampleRunId: string | null;
  readonly goToStep: (index: number) => void;
  readonly showToast: (kind: "ok" | "err", message: string) => void;
  readonly evidence: ReturnType<typeof useNewRunWizardPendingEvidence>;
  readonly tryWithDemoData: (scenarioId: AzureExtractorDemoScenarioId) => void;
  readonly skipEvidenceAndAdvance: () => void;
  readonly focusedPilotModeEnabled: boolean;
  readonly setFocusedPilotModeEnabled: (enabled: boolean) => void;
  readonly baselineReviewCycleHours: string;
  readonly setBaselineReviewCycleHours: (value: string) => void;
  readonly baselineConfidence: WizardBaselineConfidence;
  readonly setBaselineConfidence: (value: WizardBaselineConfidence) => void;
  readonly baselineMetricsError: string | null;
  readonly setBaselineMetricsError: (error: string | null) => void;
  readonly runId: string | null;
  readonly showNav: boolean;
  readonly creationProgress: WizardCreationProgressState;
  readonly recheckUnresolvedRun: () => Promise<void>;
  readonly submitError: unknown;
  readonly isReviewStep: boolean;
  readonly goBack: () => void;
  readonly goNext: () => Promise<void>;
  readonly submitRun: () => Promise<void>;
  readonly saveWizardDraft: () => void;
  readonly isCreating: boolean;
  readonly canProceed: boolean;
  readonly canSubmit: boolean;
  readonly isFirstStep: boolean;
  readonly liveMessage: string;
  readonly liveRef: RefObject<HTMLDivElement | null>;
};

/** Wizard body JSX for the new-run guided flow (steps, mode toggles, footer). */
export function NewRunWizardStepBody(props: NewRunWizardStepBodyProps) {
  return (
    <>
      {props.followUpSourceRunId !== null ? (
        <p
          className={cn(
            "rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-2 dark:border-neutral-800",
            OPERATOR_TYPOGRAPHY.body,
          )}
          data-testid="new-run-follow-up-source-run-id"
        >
          Follow-up review for prior review{" "}
          <span className={cn("font-mono", OPERATOR_TYPOGRAPHY.micro)}>{props.followUpSourceRunId}</span>. Source context
          is stored for a future wizard prefill.
        </p>
      ) : null}
      {props.exampleTemplate !== null ? <ReviewIntakeExampleTemplateCallout template={props.exampleTemplate} /> : null}
      {props.showFirstRunProgressBanner ? <CorePilotProgressTrackerBanner /> : null}

      <NewRunWizardModeToggle
        wizardMode={props.wizardMode}
        quickModeLabel={props.quickModeLabel}
        fullWizardStepCount={props.fullWizardStepCountLabel}
        showToggle={props.showWizardModeToggle}
        onModeChange={props.persistWizardMode}
        onAdvancedOptIn={props.onAdvancedOptIn}
      />

      {isOperatorExperienceFullShellEnv() && props.llmBudgetStatus !== null ? (
        <LlmMonthlyBudgetExceededBanner status={props.llmBudgetStatus} />
      ) : null}

      {props.showQuickTrack ? (
        <>
          {props.postCreateEvidencePanel}
          {props.pipelineTrackPanel}
        </>
      ) : null}

      {props.showSimplifiedPilotWizard ? (
        <SimplifiedPilotWizard
          key="simplified-pilot"
          blocksLlmExecution={props.blocksLlmExecution}
          llmBudgetStatus={props.llmBudgetStatus}
          onPendingZipFileChange={props.evidence.handlePendingEvidenceFileChange}
          onRunCreated={props.onRunCreated}
        />
      ) : null}

      {props.showQuickStartWizard ? (
        <QuickStartWizard
          key={props.wizardMode}
          blocksLlmExecution={props.blocksLlmExecution}
          llmBudgetStatus={props.llmBudgetStatus}
          initialPresetId={props.presetDeeplinkPresetId ?? undefined}
          exampleTemplate={props.exampleTemplate}
          onRunCreated={props.onRunCreated}
        />
      ) : null}

      {props.showFullWizardShell && props.presetDeeplinkPresetId !== null ? (
        <p
          className={cn(
            "rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-2 dark:border-neutral-800",
            OPERATOR_TYPOGRAPHY.body,
          )}
          data-testid="wizard-preset-deeplink-active"
          data-preset-id={props.presetDeeplinkPresetId}
        >
          Preset applied from link:{" "}
          <span className="font-medium">{props.presetDeeplinkToken ?? props.presetDeeplinkPresetId}</span>
        </p>
      ) : null}

      {props.showFullWizardShell ? (
        <>
          {props.templateWizardSession.pendingRestore !== null && !props.suppressWizardResumePrompt ? (
            <WizardSessionResumePrompt
              onResume={props.templateWizardSession.acceptRestore}
              onDismiss={props.templateWizardSession.dismissRestore}
            />
          ) : null}
          {props.showDetailedPathStepperChrome ? (
            <>
              <div className="flex flex-wrap items-start justify-between gap-2" data-testid="new-run-wizard-progress">
                <div className="min-w-0 flex-1 space-y-1">
                  <p
                    className="m-0 font-medium text-neutral-900 dark:text-neutral-100"
                    data-testid="new-run-wizard-stage-line"
                  >
                    Stage {props.macroStep + 1} of {MACRO_WIZARD_STEP_DEFINITIONS.length} —{" "}
                    {MACRO_WIZARD_STEP_DEFINITIONS[props.macroStep].label}
                  </p>
                  <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)} data-testid="new-run-wizard-step-line">
                    Step {props.stepIndex + 1}: {props.stepDefinitions[props.stepIndex].label}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                  <WizardSessionSaveStatus saveState={props.templateWizardSession.saveState} />
                  <ArchitectureRequestWizardHelpDrawer />
                </div>
              </div>

              <WizardStepper
                steps={[...MACRO_WIZARD_STEP_DEFINITIONS]}
                currentStep={props.macroStep}
                completedSteps={[...props.completedMacroSteps]}
              />
              <IntegrationConnectChecklist
                title="Complete setup checklist"
                steps={props.wizardCompleteSetupSteps}
                emphasizedStepId={props.wizardCompleteSetupEmphasizedStepId}
                testIdPrefix="new-run-wizard-complete-setup"
              />
            </>
          ) : null}

          {props.showDetailedPathStepperChrome && props.showStepRecap ? (
            <NewRunWizardStepRecap stepIndex={props.stepIndex} />
          ) : null}

          {props.stepIndex === 0 ? (
            props.embeddedInPathSwitcher ? (
              <div data-testid="reviews-new-detailed-template-entry">
                <WizardStepPreset
                  baselineFirst={props.baselineFirst}
                  featuredSampleRunId={props.featuredSampleRunId}
                  onStartingPointCommitted={() => props.goToStep(1)}
                  onWizardNotice={(kind, message) => props.showToast(kind === "ok" ? "ok" : "err", message)}
                />
              </div>
            ) : (
              <WizardStepPreset
                baselineFirst={props.baselineFirst}
                featuredSampleRunId={props.featuredSampleRunId}
                onStartingPointCommitted={() => props.goToStep(1)}
                onWizardNotice={(kind, message) => props.showToast(kind === "ok" ? "ok" : "err", message)}
              />
            )
          ) : null}
          {props.stepIndex === FULL_WIZARD_EVIDENCE_STEP_INDEX && !props.baselineFirst ? (
            <WizardStepEvidenceUpload
              pendingFile={props.evidence.pendingEvidenceFile}
              pendingDocumentFiles={props.evidence.pendingDocumentFiles}
              onPendingFileChange={props.evidence.handlePendingEvidenceFileChange}
              onPendingDocumentFilesChange={props.evidence.setPendingDocumentFiles}
              onTryDemoData={props.tryWithDemoData}
              onSkipDemoData={props.skipEvidenceAndAdvance}
            />
          ) : null}
          {props.stepIndex === 1 && props.baselineFirst ? (
            <WizardStepBaselineZip onPendingZipFileChange={props.evidence.handlePendingEvidenceFileChange} />
          ) : null}
          {props.stepIndex === 2 ? (
            <div className={OPERATOR_LAYOUT.sectionStack}>
              <ReviewAssuranceCoverageSection
                focusedPilotModeEnabled={props.focusedPilotModeEnabled}
                onFocusedPilotModeEnabledChange={props.setFocusedPilotModeEnabled}
              />
              <WizardStepIdentity />
              <WizardStepDescription />
            </div>
          ) : null}
          {props.stepIndex === 3 ? <WizardStepConstraints /> : null}
          {props.stepIndex === 4 ? (
            <WizardStepCloudInventoryContext
              pendingFile={props.evidence.pendingEvidenceFile}
              onPendingFileChange={props.evidence.handlePendingEvidenceFileChange}
            />
          ) : null}
          {props.stepIndex === 5 ? <WizardStepAdvanced /> : null}
          {props.stepIndex === FULL_WIZARD_BASELINE_METRICS_STEP_INDEX ? (
            <WizardStepBaselineMetrics
              reviewCycleHours={props.baselineReviewCycleHours}
              confidence={props.baselineConfidence}
              fieldError={props.baselineMetricsError}
              onReviewCycleHoursChange={(value: string) => {
                props.setBaselineReviewCycleHours(value);

                if (props.baselineMetricsError !== null) {
                  props.setBaselineMetricsError(null);
                }
              }}
              onConfidenceChange={props.setBaselineConfidence}
            />
          ) : null}
          {props.stepIndex === REVIEW_STEP_INDEX ? (
            <WizardStepReview focusedPilotModeEnabled={props.focusedPilotModeEnabled} />
          ) : null}
          {props.stepIndex === TRACK_STEP_INDEX && props.runId ? (
            <>
              {props.postCreateEvidencePanel}
              {props.pipelineTrackPanel}
            </>
          ) : null}

          {props.showNav ? (
            <WizardStickyFooter
              testIdPrefix="new-run-wizard"
              progress={props.creationProgress}
              onRecheck={() => {
                void props.recheckUnresolvedRun();
              }}
              submitError={props.submitError}
              showSubmitError={props.isReviewStep}
            >
              <WizardNavButtons
                onBack={props.goBack}
                onNext={props.isReviewStep ? undefined : props.goNext}
                onSubmit={props.isReviewStep ? props.submitRun : undefined}
                onSaveDraft={props.saveWizardDraft}
                submitting={props.isCreating}
                canProceed={props.canProceed}
                canSubmit={props.canSubmit}
                isFirstStep={props.isFirstStep}
                isLastInputStep={props.isReviewStep}
                nextLabel={props.stepIndex === 0 ? "Continue" : "Next"}
                submitLabel={BUYER_START_ARCHITECTURE_REVIEW_CTA}
                submittingLabel="Creating…"
              />
            </WizardStickyFooter>
          ) : null}

          {props.stepIndex === TRACK_STEP_INDEX && !props.runId ? (
            <p className={cn("text-red-600", OPERATOR_TYPOGRAPHY.body)}>Review id missing; cannot track pipeline.</p>
          ) : null}
        </>
      ) : null}

      <div ref={props.liveRef} aria-live="polite" aria-atomic="true" className="sr-only">
        {props.liveMessage}
      </div>

      {isBuyerPolishedOperatorShellEnv() ? (
        <div className="mt-6" data-testid="new-run-wizard-llm-usage-band-footer">
          <LlmUsageBandHint />
        </div>
      ) : null}
    </>
  );
}
