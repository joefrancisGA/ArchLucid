"use client";

import { WizardReviewAssuranceCoverageSection } from "@/components/wizard/WizardReviewAssuranceCoverageSection";
import { WizardStepConstraints } from "@/components/wizard/steps/WizardStepConstraints";
import { WizardStepDescription } from "@/components/wizard/steps/WizardStepDescription";
import { WizardStepEvidenceUpload } from "@/components/wizard/steps/WizardStepEvidenceUpload";
import { WizardStepIdentity } from "@/components/wizard/steps/WizardStepIdentity";
import { WizardStepPreset } from "@/components/wizard/steps/WizardStepPreset";
import { WizardStepReview } from "@/components/wizard/steps/WizardStepReview";
import type { AzureExtractorDemoScenarioId } from "@/lib/arch-lucid-azure-extractor-demo-scenarios";
import { OPERATOR_LAYOUT } from "@/lib/design-tokens";
import type { WizardBaselineConfidence } from "@/lib/wizard-baseline-confidence";
import {
  FULL_WIZARD_BASELINE_METRICS_STEP_INDEX,
  FULL_WIZARD_EVIDENCE_STEP_INDEX,
} from "@/lib/wizard-step-fields";

import {
  WizardStepAdvanced,
  WizardStepBaselineMetrics,
  WizardStepBaselineZip,
  WizardStepCloudInventoryContext,
} from "./NewRunWizardDeferredChunks";
import { REVIEW_STEP_INDEX, TRACK_STEP_INDEX } from "./new-run-wizard-steps";
import type { useNewRunWizardPendingEvidence } from "./use-new-run-wizard-pending-evidence";

export type NewRunWizardStepPanelsProps = {
  readonly embeddedInPathSwitcher: boolean;
  readonly baselineFirst: boolean;
  readonly featuredSampleRunId: string | null;
  readonly stepIndex: number;
  readonly focusedPilotModeEnabled: boolean;
  readonly setFocusedPilotModeEnabled: (enabled: boolean) => void;
  readonly baselineReviewCycleHours: string;
  readonly setBaselineReviewCycleHours: (value: string) => void;
  readonly baselineConfidence: WizardBaselineConfidence;
  readonly setBaselineConfidence: (value: WizardBaselineConfidence) => void;
  readonly baselineMetricsError: string | null;
  readonly setBaselineMetricsError: (error: string | null) => void;
  readonly runId: string | null;
  readonly postCreateEvidencePanel: React.ReactNode;
  readonly pipelineTrackPanel: React.ReactNode;
  readonly evidence: ReturnType<typeof useNewRunWizardPendingEvidence>;
  readonly tryWithDemoData: (scenarioId: AzureExtractorDemoScenarioId) => void;
  readonly skipEvidenceAndAdvance: () => void;
  readonly goToStep: (index: number) => void;
  readonly showToast: (kind: "ok" | "err", message: string) => void;
};

/** Full-wizard step body panels keyed by `stepIndex` (preset through track). */
export function NewRunWizardStepPanels(props: NewRunWizardStepPanelsProps): React.JSX.Element | null {
  if (props.stepIndex === 0) {
    if (props.embeddedInPathSwitcher) {
      return (
        <div data-testid="reviews-new-detailed-template-entry">
          <WizardStepPreset
            baselineFirst={props.baselineFirst}
            featuredSampleRunId={props.featuredSampleRunId}
            onStartingPointCommitted={() => props.goToStep(1)}
            onWizardNotice={(kind, message) => props.showToast(kind === "ok" ? "ok" : "err", message)}
          />
        </div>
      );
    }

    return (
      <WizardStepPreset
        baselineFirst={props.baselineFirst}
        featuredSampleRunId={props.featuredSampleRunId}
        onStartingPointCommitted={() => props.goToStep(1)}
        onWizardNotice={(kind, message) => props.showToast(kind === "ok" ? "ok" : "err", message)}
      />
    );
  }

  if (props.stepIndex === FULL_WIZARD_EVIDENCE_STEP_INDEX && !props.baselineFirst) {
    return (
      <WizardStepEvidenceUpload
        pendingFile={props.evidence.pendingEvidenceFile}
        pendingDocumentFiles={props.evidence.pendingDocumentFiles}
        onPendingFileChange={props.evidence.handlePendingEvidenceFileChange}
        onPendingDocumentFilesChange={props.evidence.setPendingDocumentFiles}
        onTryDemoData={props.tryWithDemoData}
        onSkipDemoData={props.skipEvidenceAndAdvance}
      />
    );
  }

  if (props.stepIndex === 1 && props.baselineFirst) {
    return <WizardStepBaselineZip onPendingZipFileChange={props.evidence.handlePendingEvidenceFileChange} />;
  }

  if (props.stepIndex === 2) {
    return (
      <div className={OPERATOR_LAYOUT.sectionStack}>
        <WizardReviewAssuranceCoverageSection
          focusedPilotModeEnabled={props.focusedPilotModeEnabled}
          onFocusedPilotModeEnabledChange={props.setFocusedPilotModeEnabled}
        />
        <WizardStepIdentity />
        <WizardStepDescription />
      </div>
    );
  }

  if (props.stepIndex === 3) {
    return <WizardStepConstraints />;
  }

  if (props.stepIndex === 4) {
    return (
      <WizardStepCloudInventoryContext
        pendingFile={props.evidence.pendingEvidenceFile}
        onPendingFileChange={props.evidence.handlePendingEvidenceFileChange}
      />
    );
  }

  if (props.stepIndex === 5) {
    return <WizardStepAdvanced />;
  }

  if (props.stepIndex === FULL_WIZARD_BASELINE_METRICS_STEP_INDEX) {
    return (
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
    );
  }

  if (props.stepIndex === REVIEW_STEP_INDEX) {
    return <WizardStepReview focusedPilotModeEnabled={props.focusedPilotModeEnabled} />;
  }

  if (props.stepIndex === TRACK_STEP_INDEX && props.runId) {
    return (
      <>
        {props.postCreateEvidencePanel}
        {props.pipelineTrackPanel}
      </>
    );
  }

  return null;
}
