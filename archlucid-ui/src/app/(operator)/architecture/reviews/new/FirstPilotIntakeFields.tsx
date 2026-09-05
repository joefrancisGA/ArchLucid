"use client";

import { useRef } from "react";

import { cn } from "@/lib/utils";

import { QuickStartL0MustQuestionsPanel } from "@/components/architecture/QuickStartL0MustQuestionsPanel";
import { useExpertIntakePostureEnabled } from "@/components/reviews/ExpertIntakePostureToggle";
import { EvidenceExtractionProgressCard } from "@/components/evidence/EvidenceExtractionProgressCard";
import { EvidenceExtractionStickyIndicator } from "@/components/evidence/EvidenceExtractionStickyIndicator";
import { EvidenceGapForecastPanel } from "@/components/evidence/EvidenceGapForecastPanel";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PreExecuteCostEstimateNotice } from "@/components/usability/PreExecuteCostEstimateNotice";
import { WorkspaceSystemNameAvailabilityFeedback } from "@/components/intake/WorkspaceSystemNameAvailabilityFeedback";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { FocusedPilotPolicyPackAppliedCallout } from "@/components/wizard/FocusedPilotPolicyPackAppliedCallout";
import { ReviewAssuranceCoverageSection } from "@/components/wizard/ReviewAssuranceCoverageSection";
import { WizardPolicyPackCloudMismatchCallout } from "@/components/wizard/WizardPolicyPackCloudMismatchCallout";
import { useElementOutOfView } from "@/hooks/use-element-out-of-view";
import { CREATE_REVIEW_PACKAGE_HEADING } from "@/lib/buyer/buyer-polish-copy";
import { REVIEW_INTAKE_EVIDENCE_FIRST_PROGRESS_LEAD } from "@/lib/create-vs-review-intake-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { ARCHITECTURE_DOCUMENT_READ_AFTER_UPLOAD_HELPER } from "@/lib/evidence-readable-text";
import { QUICK_START_EVIDENCE_UPLOAD_DESCRIPTION } from "@/lib/evidence-upload-accepted-formats";
import { FIRST_PILOT_ARCHITECTURE_CONTEXT_MIN_HELPER, FIRST_PILOT_MIN_BRIEF_CHARS } from "@/lib/first-pilot-intake";
import { GUIDED_INTAKE_ARCHITECTURE_CONTEXT_LABEL } from "@/lib/guided-intake-copy";
import { CORE_PILOT_PATH_STREAMLINED_LABELS } from "@/lib/vocabulary/core-pilot-path-vocabulary";

import { FirstPilotIntakeScopeGate } from "./FirstPilotIntakeScopeGate";
import { FirstPilotIntakeStartFooter } from "./FirstPilotIntakeStartFooter";
import type { FirstPilotIntakeWizardState } from "./use-first-pilot-intake-wizard";
import { WizardEvidenceUploadZone } from "./QuickReviewWizardDeferredPanels";

type IntakeFieldLabelProps = {
  readonly htmlFor: string;
  readonly label: string;
  readonly required: boolean;
};

function IntakeFieldLabel(props: IntakeFieldLabelProps): React.JSX.Element {
  return (
    <Label htmlFor={props.htmlFor} className="font-semibold text-neutral-900 dark:text-neutral-100">
      {props.label}
      <span className={cn("font-normal text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
        {props.required ? " (required)" : " (required without evidence)"}
      </span>
    </Label>
  );
}

type FirstPilotIntakeFieldsProps = {
  readonly wizard: FirstPilotIntakeWizardState;
};

export function FirstPilotIntakeFields(props: FirstPilotIntakeFieldsProps): React.JSX.Element {
  const { wizard } = props;
  const expertIntakePosture = useExpertIntakePostureEnabled();
  const extractionCardRef = useRef<HTMLDivElement>(null);
  const extractionProgress = wizard.evidenceExtractionProgress;
  const showExtractionCard = extractionProgress.phase !== "idle";
  const cardIsOutOfView = useElementOutOfView(extractionCardRef, showExtractionCard);

  return (
    <section className="space-y-4" data-testid="first-pilot-intake-panel">
      <EvidenceExtractionStickyIndicator
        visible={showExtractionCard && cardIsOutOfView}
        phase={extractionProgress.phase === "complete" ? "complete" : "processing"}
      />

      <div className="space-y-1">
        <h2
          className={cn("font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}
        >
          {CREATE_REVIEW_PACKAGE_HEADING}
        </h2>
        <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          {expertIntakePosture
            ? "Expert intake: paste your brief first, then confirm MUST questions in the checklist below."
            : REVIEW_INTAKE_EVIDENCE_FIRST_PROGRESS_LEAD}
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <IntakeFieldLabel htmlFor="first-pilot-title" label="Review title" required />
          <Input
            id="first-pilot-title"
            value={wizard.runTitle}
            onChange={(event) => {
              wizard.setRunTitle(event.target.value);
              wizard.setClientValidationMessage(null);
            }}
            placeholder="Example: Retail API modernization review"
            autoComplete="off"
            aria-required
            data-testid="first-pilot-title"
            aria-invalid={
              wizard.systemNameAvailability.validationReady &&
              !wizard.systemNameAvailability.isAvailable
            }
          />
          <WorkspaceSystemNameAvailabilityFeedback
            availability={wizard.systemNameAvailability}
            testId="first-pilot-title-availability"
          />
          {wizard.inheritedPriorTitle !== null ? (
            <p
              className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
              data-testid="first-pilot-prior-package-inherited"
            >
              Inherited from the prior package: “{wizard.inheritedPriorTitle}”. Keep it if this is the same decision, or
              rename it if this pass is a new decision.
            </p>
          ) : null}
        </div>

        <WizardEvidenceUploadZone
          labelId="first-pilot-evidence"
          title="Attach architecture evidence"
          description={QUICK_START_EVIDENCE_UPLOAD_DESCRIPTION}
          attachmentSummarySuffix="architecture context optional"
          onFilesSelected={(files: File[]) => {
            wizard.setEvidenceFiles(files);
            wizard.setLimitedEvidenceAnalysisAcknowledged(false);
            wizard.setClientValidationMessage(null);
          }}
        />

        {showExtractionCard ? (
          <EvidenceExtractionProgressCard
            cardRef={extractionCardRef}
            phase={extractionProgress.phase === "complete" ? "complete" : "processing"}
            documentNames={extractionProgress.documentNames}
            stages={extractionProgress.stages}
            activeStageIndex={extractionProgress.activeStageIndex}
            completion={extractionProgress.completion}
          />
        ) : wizard.showBinaryDocumentReadAfterUploadHelper ? (
          <p
            className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
            data-testid="first-pilot-binary-document-read-after-upload"
          >
            {ARCHITECTURE_DOCUMENT_READ_AFTER_UPLOAD_HELPER}
          </p>
        ) : null}

        {wizard.showLimitedEvidenceAcknowledgment ? (
          <div
            className="flex items-start gap-3 rounded-md border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-700 dark:bg-neutral-900/40"
            data-testid="first-pilot-limited-evidence-ack"
          >
            <Checkbox
              id="first-pilot-limited-evidence-ack"
              checked={wizard.limitedEvidenceAnalysisAcknowledged}
              onCheckedChange={(checked) => {
                wizard.setLimitedEvidenceAnalysisAcknowledged(checked === true);
                wizard.setClientValidationMessage(null);
              }}
              data-testid="first-pilot-limited-evidence-ack-checkbox"
            />
            <div className="space-y-1">
              <Label
                htmlFor="first-pilot-limited-evidence-ack"
                className={cn("font-medium text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}
              >
                Confirm limited evidence before starting
              </Label>
              <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                Attached files are stored on the evidence trail but may not include analyzable architecture
                inventory, IaC, or a written brief. Check this only when you accept a thinner first pass.
              </p>
            </div>
          </div>
        ) : null}

        <div className="space-y-2">
          <IntakeFieldLabel htmlFor="first-pilot-brief" label={GUIDED_INTAKE_ARCHITECTURE_CONTEXT_LABEL} required={false} />
          <Textarea
            id="first-pilot-brief"
            value={wizard.briefText}
            onChange={(event) => {
              wizard.setBriefText(event.target.value);
              wizard.setClientValidationMessage(null);
            }}
            className={cn("min-h-[100px]", OPERATOR_TYPOGRAPHY.body)}
            placeholder="Add as much useful context as you can: goals, constraints, risks, business drivers, integrations, data flows, security concerns, known tradeoffs, and what you want ArchLucid to focus on."
            aria-describedby="first-pilot-brief-hint"
            data-testid="first-pilot-brief"
          />
          <p
            id="first-pilot-brief-hint"
            className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
          >
            {FIRST_PILOT_ARCHITECTURE_CONTEXT_MIN_HELPER}
          </p>
        </div>

        <EvidenceGapForecastPanel
          presence={wizard.evidencePresence}
          attachmentFileNames={wizard.evidenceFileNames}
          architectureContextPresent={wizard.briefText.trim().length >= FIRST_PILOT_MIN_BRIEF_CHARS}
          presentation="expandable"
        />

        <QuickStartL0MustQuestionsPanel
          answers={wizard.l0Answers}
          skippedQuestionKeys={wizard.l0SkippedQuestionKeys}
          inferredQuestionKeys={wizard.inferredL0QuestionKeys}
          rephrasedQuestionKeys={wizard.rephrasedL0QuestionKeys}
          isSimulator={wizard.isSimulator}
          clarificationSuggestionsUnavailable={wizard.clarificationSuggestionsUnavailable}
          canSuggestFromEvidence={wizard.canSuggestFromEvidence}
          isSuggestingFromEvidence={wizard.isExtractingEvidenceText}
          onSuggestFromEvidence={wizard.suggestAnswersFromEvidence}
          busy={wizard.creationProgress.isActive || wizard.blocksLlmExecution}
          onAnswersChange={wizard.setL0Answers}
          onSkippedQuestionKeysChange={wizard.setL0SkippedQuestionKeys}
          onQuestionEdited={wizard.markL0QuestionEdited}
        />

        <FirstPilotIntakeScopeGate wizard={wizard} />

        <PreExecuteCostEstimateNotice
          testId="first-pilot-pre-execute-cost"
          remainingBudgetUsd={wizard.llmBudgetStatus?.remainingBudgetUsd ?? null}
          monthlyBudgetMonitoringActive={wizard.llmBudgetStatus?.monthlyBudgetMonitoringActive ?? null}
          useBudgetGate={false}
        />

        <CollapsibleSection
          title="Review standards selection"
          summaryLine={CORE_PILOT_PATH_STREAMLINED_LABELS.firstIntakeAdvancedNote}
          sectionTestId="first-pilot-standards-selection"
        >
          <FocusedPilotPolicyPackAppliedCallout className="mb-3" />
          <ReviewAssuranceCoverageSection
            togglePresentation="choice"
            focusedPilotModeEnabled={wizard.focusedPilotModeEnabled}
            onFocusedPilotModeEnabledChange={wizard.setFocusedPilotModeEnabled}
            cloudProvider={wizard.coveragePreviewCloudProvider}
            descriptionText={wizard.coveragePreviewDescriptionText}
            securityIntakeAnswer={wizard.coveragePreviewSecurityIntakeAnswer}
          />
        </CollapsibleSection>

        {wizard.policyPackCloudMismatch !== null ? (
          <WizardPolicyPackCloudMismatchCallout detail={wizard.policyPackCloudMismatch} />
        ) : null}

        <FirstPilotIntakeStartFooter
          writeDestination={wizard.writeDestination}
          intakeGap={wizard.startBlocker}
          creationProgress={wizard.creationProgress}
          clientValidationMessage={wizard.clientValidationMessage}
          wizardSaveState={wizard.wizardSession.saveState}
          blocksLlmExecution={wizard.blocksLlmExecution}
          onStartReview={() => {
            void wizard.submitRun();
          }}
          onRecheckUnresolved={() => {
            void wizard.recheckUnresolvedRun();
          }}
        />
      </div>
    </section>
  );
}
