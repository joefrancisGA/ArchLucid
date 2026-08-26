"use client";

import { type Dispatch, type SetStateAction } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { cn } from "@/lib/utils";

import { ArchitectureDraftDetailBreadcrumb } from "@/app/(operator)/architecture/architectures/_sections/ArchitectureDraftDetailBreadcrumb";
import { ArchitectureDraftDetailBuyerChrome } from "@/app/(operator)/architecture/architectures/_sections/ArchitectureDraftDetailBuyerChrome";
import { ArchitectureCreationLocalDraftsPanel } from "@/components/architecture/ArchitectureCreationLocalDraftsPanel";
import { ArchitectureDraftDeleteControl } from "@/components/architecture/ArchitectureDraftDeleteControl";
import { ArchitectureDraftDetailLoadFailure } from "@/components/architecture/ArchitectureDraftDetailLoadFailure";
import { ArchitectureDraftFormFields } from "@/components/architecture/ArchitectureDraftFormFields";
import { ArchitectureDraftGuidanceDisclosure } from "@/components/architecture/ArchitectureDraftGuidanceDisclosure";
import { ArchitectureDraftHandoffBanner } from "@/components/architecture/ArchitectureDraftHandoffBanner";
import { ArchitectureDraftIntakeModeBanner } from "@/components/architecture/ArchitectureDraftIntakeModeBanner";
import { ArchitectureDraftQualityAttributesEncouragementDialog } from "@/components/architecture/ArchitectureDraftQualityAttributesEncouragementDialog";
import { ArchitectureDraftStartReviewGate } from "@/components/architecture/ArchitectureDraftStartReviewGate";
import { ArchitectureScopeUnderstandingCheckPanel } from "@/components/architecture/ArchitectureScopeUnderstandingCheckPanel";
import { ArchitectureDraftWorkspaceLoadingSkeleton } from "@/components/architecture/ArchitectureDraftWorkspaceLoadingSkeleton";
import { ArchitectureDraftWorkspaceSaveActions } from "@/components/architecture/ArchitectureDraftWorkspaceSaveActions";
import { ArchitectureDraftNextDraftFooter } from "@/components/architecture/ArchitectureDraftNextDraftFooter";
import { IntegrationConnectChecklist } from "@/components/integrations/IntegrationConnectChecklist";
import { AiBudgetSpendNotice } from "@/components/ai-budget/AiBudgetSpendNotice";
import { OperatorMutationInlineError } from "@/components/operator/OperatorMutationInlineError";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { InlineGuidanceText } from "@/components/InlineGuidanceText";
import { PageHeaderClaimDiscipline } from "@/components/operator/page-header-claim-discipline";
import { PreExecuteCostEstimateNotice } from "@/components/usability/PreExecuteCostEstimateNotice";
import { Button } from "@/components/ui/button";
import { ReviewStartLoadingButton } from "@/components/review-intake/ReviewStartLoadingButton";
import { ReviewStartNavigationStallNotice } from "@/components/review-intake/ReviewStartNavigationStallNotice";
import { ReviewStartStagedProgress } from "@/components/review-intake/ReviewStartStagedProgress";
import { Card, CardContent } from "@/components/ui/card";
import type { ArchitectureDraftSaveState } from "@/hooks/use-architecture-draft-autosave";
import {
  ARCHITECTURE_DRAFT_START_REVIEW_CHECKLIST_TITLE,
} from "@/lib/architecture-draft-start-review-checklist";
import {
  ARCHITECTURE_DRAFT_INTAKE_MODE_CONTINUE_LABEL,
} from "@/lib/architecture/architecture-draft-intake-mode";
import { GuidedIntakeAlreadySubmittedCallout } from "@/app/(operator)/architecture/reviews/new/GuidedIntakeAlreadySubmittedCallout";
import { BUYER_START_ARCHITECTURE_REVIEW_CTA } from "@/lib/buyer/buyer-polish-copy";
import { ARCHITECTURES_DRAFT_CLAIM_DISCIPLINE } from "@/lib/architectures-draft-evidence-copy";
import { OPERATOR_LINK, OPERATOR_PAGE_LEAD_MEASURE, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { reviewDetailPath, startReviewFromArchitectureHref } from "@/lib/architecture/architecture-routes";
import type { ArchitectureDraftFieldState } from "@/lib/architecture/architecture-draft-readiness";
import {
  ARCHITECTURE_DRAFT_DETAIL_AUTOSAVE_SENTENCE,
  ARCHITECTURE_DRAFT_DETAIL_DRAFTING_SCOPE_SENTENCE,
  resolveArchitectureDraftRefineGuidanceSentence,
} from "@/lib/architecture/architecture-draft-detail-page-copy";
import type { ReviewStartStageId } from "@/lib/review-start-progress-stages";
import type { ActorSet, DraftRequestResponse } from "@/types/draft-intake";

const ArchitectureDraftAiRefinePanel = dynamic(
  async () => {
    const module = await import("@/components/architecture/ArchitectureDraftAiRefinePanel");
    return module.ArchitectureDraftAiRefinePanel;
  },
  { loading: () => null },
);

const DraftIntakeAdvancedSection = dynamic(
  async () => {
    const module = await import("@/components/draft-intake/DraftIntakeAdvancedSection");
    return module.DraftIntakeAdvancedSection;
  },
  { loading: () => null },
);

const DraftIntakeReasoningPanel = dynamic(
  async () => {
    const module = await import("@/components/draft-intake/DraftIntakeReasoningPanel");
    return module.DraftIntakeReasoningPanel;
  },
  { loading: () => null },
);

export type ArchitectureDraftWorkspaceBodyProps = {
  readonly architectureId: string;
  readonly loading: boolean;
  readonly loadError: string | null;
  readonly isNewDraft: boolean;
  readonly isDetailDraft: boolean;
  readonly buyerPolishedShell: boolean;
  readonly workspaceHeading: string;
  readonly workspaceLead: string;
  readonly linkedReviewId: string | null;
  readonly linkedReviewTitle: string;
  readonly intakeModeActive: boolean;
  readonly briefFrozen: boolean;
  readonly canUnlockBrief: boolean;
  readonly unlockBusy: boolean;
  readonly onUnlockBrief: () => void;
  readonly draft: DraftRequestResponse | null;
  readonly conflictMessage: string | null;
  readonly onReloadDraft: () => void;
  readonly onLoadDraft: () => void;
  readonly draftStartReviewChecklistDescription: string;
  readonly draftStartReviewSteps: Parameters<typeof IntegrationConnectChecklist>[0]["steps"];
  readonly draftStartReviewEmphasizedStepId: string;
  readonly fields: ArchitectureDraftFieldState;
  readonly actorSet: ActorSet;
  readonly editorLocked: boolean;
  readonly handoffEditorLocked: boolean;
  readonly blocksLlmExecution: boolean;
  readonly effectiveArchitectureId: string;
  readonly reviewReadiness: Parameters<typeof ArchitectureDraftStartReviewGate>[0]["reviewReadiness"];
  readonly needsPersistedDraftBeforeStart: boolean;
  readonly scopeGateOpen: boolean;
  readonly actorSuggestionsUnresolved: boolean;
  readonly startReviewError: string | null;
  readonly saveState: ArchitectureDraftSaveState;
  readonly scopeUnderstandingInput: Parameters<typeof ArchitectureScopeUnderstandingCheckPanel>[0]["input"];
  readonly setScopeBullets: Parameters<typeof ArchitectureScopeUnderstandingCheckPanel>[0]["onBulletsChange"];
  readonly setScopeGateOpen: Parameters<typeof ArchitectureScopeUnderstandingCheckPanel>[0]["onGateChange"];
  readonly setActorSuggestionsUnresolved: (value: boolean) => void;
  readonly actorSuggestionGateRequestId: number;
  readonly setFields: Dispatch<SetStateAction<ArchitectureDraftFieldState>>;
  readonly setActorSet: Dispatch<SetStateAction<ActorSet>>;
  readonly refinementDraftId: string | null;
  readonly exitPending: boolean;
  readonly reviewStartProgress: {
    readonly isPending: boolean;
    readonly loadingLabel: string;
    readonly stageId: ReviewStartStageId | null;
    readonly stages: Parameters<typeof ReviewStartStagedProgress>[0]["stages"];
    readonly waitCopy: { readonly detail: string };
    readonly stalled: boolean;
  };
  readonly canStartReview: boolean;
  readonly handleStartReview: () => void | Promise<void>;
  readonly handleAcknowledgeHandoff: () => void;
  readonly saveDraft: () => Promise<boolean>;
  readonly setExitPending: (pending: boolean) => void;
  readonly hasPersistedDraft: boolean;
  readonly qualityAttributesEncouragementOpen: boolean;
  readonly setQualityAttributesEncouragementOpen: (open: boolean) => void;
  readonly handleEncourageAddQualityAttributes: () => void;
  readonly handleContinueWithoutQualityAttributes: () => void;
  readonly nextDraft: Parameters<typeof ArchitectureDraftNextDraftFooter>[0]["target"] | null;
};

export function ArchitectureDraftWorkspaceBody(props: ArchitectureDraftWorkspaceBodyProps): React.JSX.Element {
  const {
    loading,
    loadError,
    isDetailDraft,
    buyerPolishedShell,
    workspaceHeading,
    workspaceLead,
    linkedReviewId,
    linkedReviewTitle,
    intakeModeActive,
    briefFrozen,
    canUnlockBrief,
    unlockBusy,
    onUnlockBrief,
    draft,
    conflictMessage,
    onReloadDraft,
    onLoadDraft: loadDraft,
    draftStartReviewChecklistDescription,
    draftStartReviewSteps,
    draftStartReviewEmphasizedStepId,
    fields,
    actorSet,
    editorLocked,
    handoffEditorLocked,
    blocksLlmExecution,
    effectiveArchitectureId,
    reviewReadiness,
    needsPersistedDraftBeforeStart,
    scopeGateOpen,
    actorSuggestionsUnresolved,
    startReviewError,
    saveState,
    scopeUnderstandingInput,
    setScopeBullets,
    setScopeGateOpen,
    setActorSuggestionsUnresolved,
    actorSuggestionGateRequestId,
    setFields,
    setActorSet,
    refinementDraftId,
    exitPending,
    reviewStartProgress,
    canStartReview,
    handleStartReview,
    handleAcknowledgeHandoff,
    saveDraft,
    setExitPending,
    hasPersistedDraft,
    isNewDraft,
    qualityAttributesEncouragementOpen,
    setQualityAttributesEncouragementOpen,
    handleEncourageAddQualityAttributes,
    handleContinueWithoutQualityAttributes,
    nextDraft,
  } = props;

  if (loading) {
  return (
    <div className="space-y-3" data-testid="architecture-draft-workspace-loading">
      <ArchitectureDraftWorkspaceLoadingSkeleton />
    </div>
  );
}

if (loadError !== null) {
  if (isDetailDraft && buyerPolishedShell) {
    return (
      <ArchitectureDraftDetailLoadFailure
        message={loadError}
        onRetry={() => {
          void loadDraft();
        }}
      />
    );
  }

  return (
    <div className="space-y-3" data-testid="architecture-draft-workspace-error">
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)} role="alert">
        {loadError}
      </p>
      <Button type="button" variant="outline" size="sm" onClick={() => void loadDraft()}>
        Retry
      </Button>
    </div>
  );
}

return (
  <div className="space-y-4" data-testid="architecture-draft-workspace">
    {isDetailDraft && buyerPolishedShell ? (
      <ArchitectureDraftDetailBreadcrumb draftLabel={workspaceHeading} />
    ) : null}

    {!isNewDraft ? (
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <h1
            className={cn("m-0", OPERATOR_TYPOGRAPHY.pageTitle)}
            data-testid="architecture-draft-workspace-title"
          >
            {workspaceHeading}
          </h1>
          <p
            className={cn("m-0", OPERATOR_PAGE_LEAD_MEASURE, OPERATOR_TYPOGRAPHY.helper)}
            data-testid="architecture-draft-workspace-lead"
          >
            {buyerPolishedShell ? (
              <>
                {ARCHITECTURE_DRAFT_DETAIL_DRAFTING_SCOPE_SENTENCE}{" "}
                <InlineGuidanceText
                  text={resolveArchitectureDraftRefineGuidanceSentence(reviewReadiness.isValid)}
                />{" "}
                {ARCHITECTURE_DRAFT_DETAIL_AUTOSAVE_SENTENCE}
              </>
            ) : (
              workspaceLead
            )}
          </p>
          {isDetailDraft && buyerPolishedShell ? (
            <PageHeaderClaimDiscipline
              text={ARCHITECTURES_DRAFT_CLAIM_DISCIPLINE}
              testId="architecture-draft-detail-claim-discipline"
              className="mt-2 text-left"
            />
          ) : null}
          {linkedReviewId !== null ? (
            <Link
              href={reviewDetailPath(linkedReviewId)}
              className={cn(OPERATOR_LINK.inline, OPERATOR_TYPOGRAPHY.helper)}
            >
              Open linked review
            </Link>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
          <PageContextualHelpButton />
          <ArchitectureDraftDeleteControl
            architectureId={props.architectureId}
            displayName={workspaceHeading}
            linkedReviewId={linkedReviewId}
            serverStatus={draft?.status ?? null}
            testId="architecture-draft-delete-workspace"
          />
        </div>
      </div>
    ) : null}

    {buyerPolishedShell ? null : <ArchitectureDraftGuidanceDisclosure />}

    {isNewDraft ? <ArchitectureCreationLocalDraftsPanel /> : null}

    {isDetailDraft && buyerPolishedShell ? <ArchitectureDraftDetailBuyerChrome /> : null}

    {linkedReviewId !== null ? (
      <ArchitectureDraftHandoffBanner
        linkedReviewId={linkedReviewId}
        linkedReviewTitle={linkedReviewTitle}
        editorLocked={handoffEditorLocked}
        onAcknowledgeEditAnyway={handleAcknowledgeHandoff}
      />
    ) : null}

    {intakeModeActive && linkedReviewId === null ? (
      <ArchitectureDraftIntakeModeBanner
        status={draft?.status}
        continueHref={startReviewFromArchitectureHref(effectiveArchitectureId)}
        canUnlock={canUnlockBrief}
        unlockBusy={unlockBusy}
        onUnlock={onUnlockBrief}
      />
    ) : null}

    {draft?.status === "Submitted" && linkedReviewId === null ? (
      <GuidedIntakeAlreadySubmittedCallout linkedSpawnedRunId={null} />
    ) : null}

    {conflictMessage !== null ? (
      <div className="space-y-2" data-testid="architecture-draft-conflict">
        <OperatorMutationInlineError
          message={conflictMessage}
          testId="architecture-draft-conflict-message"
          recoveryScenario="api-problem"
          recoveryPresentation={{
            whatFailed: "This architecture draft changed in another browser session.",
            whatIsIntact: "Your unsaved edits in this tab are still on screen and were not overwritten.",
            nextStep: "Refresh the draft to load the latest version, then re-apply any edits you still need.",
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            onReloadDraft();
          }}
          data-testid="architecture-draft-conflict-refresh"
        >
          Refresh draft
        </Button>
      </div>
    ) : null}

    <IntegrationConnectChecklist
      title={ARCHITECTURE_DRAFT_START_REVIEW_CHECKLIST_TITLE}
      description={draftStartReviewChecklistDescription}
      steps={draftStartReviewSteps}
      emphasizedStepId={draftStartReviewEmphasizedStepId}
      testIdPrefix="architecture-draft-start-review"
    />

    <Card>
      <CardContent className="space-y-6 pt-6">
        <ArchitectureDraftFormFields
          fields={fields}
          actorSet={actorSet}
          disabled={editorLocked}
          blocksLlmExecution={blocksLlmExecution}
          architectureId={effectiveArchitectureId}
          markReviewReadinessInvalid={linkedReviewId === null && !reviewReadiness.isValid}
          actorSuggestionGateRequestId={actorSuggestionGateRequestId}
          onActorSuggestionsUnresolvedChange={setActorSuggestionsUnresolved}
          onFieldsChange={setFields}
          onActorSetChange={setActorSet}
        />
      </CardContent>
    </Card>

    {refinementDraftId !== null && !editorLocked ? (
      <>
        <ArchitectureDraftAiRefinePanel
          fields={fields}
          linkedReviewId={linkedReviewId}
          disabled={exitPending || blocksLlmExecution}
        />
        <DraftIntakeAdvancedSection defaultOpen={false}>
          <AiBudgetSpendNotice
            action="Architecture reasoning"
            testId="architecture-draft-ai-budget-notice"
          />
          <DraftIntakeReasoningPanel
            draftId={refinementDraftId}
            disabled={exitPending || blocksLlmExecution}
            embedded
          />
        </DraftIntakeAdvancedSection>
      </>
    ) : null}

    {linkedReviewId === null && !briefFrozen ? (
      <ArchitectureScopeUnderstandingCheckPanel
        input={scopeUnderstandingInput}
        disabled={handoffEditorLocked || exitPending || reviewStartProgress.isPending}
        draftSaveState={saveState}
        onBulletsChange={setScopeBullets}
        onGateChange={setScopeGateOpen}
      />
    ) : null}

    {linkedReviewId === null && !briefFrozen ? (
      <PreExecuteCostEstimateNotice testId="architecture-draft-pre-execute-cost" />
    ) : null}

    <div className="space-y-2">
      <ArchitectureDraftStartReviewGate
        linkedReviewId={linkedReviewId}
        briefFrozen={briefFrozen}
        reviewReadiness={reviewReadiness}
        needsPersistedDraftBeforeStart={needsPersistedDraftBeforeStart}
        scopeGateOpen={scopeGateOpen}
        actorSuggestionsUnresolved={actorSuggestionsUnresolved}
      />
      {startReviewError !== null ? (
        <OperatorMutationInlineError
          message={startReviewError}
          testId="architecture-start-review-error"
          recoveryScenario="api-problem"
        />
      ) : null}
      <ArchitectureDraftWorkspaceSaveActions
        editorLocked={editorLocked}
        saveState={saveState}
        conflictMessage={conflictMessage}
        isNewDraft={isNewDraft}
        hasPersistedDraft={hasPersistedDraft}
        fields={fields}
        saveDraft={saveDraft}
        onExitPendingChange={setExitPending}
      >
        {intakeModeActive && linkedReviewId === null ? (
          <Button type="button" variant="primary" size="sm" asChild>
            <Link href={startReviewFromArchitectureHref(effectiveArchitectureId)}>
              {ARCHITECTURE_DRAFT_INTAKE_MODE_CONTINUE_LABEL}
            </Link>
          </Button>
        ) : linkedReviewId !== null ? (
          <Button type="button" variant="primary" size="sm" asChild data-testid="architecture-continue-review">
            <Link href={reviewDetailPath(linkedReviewId)}>Continue in review</Link>
          </Button>
        ) : (
          <ReviewStartLoadingButton
            type="button"
            variant="primary"
            size="sm"
            id="architecture-start-review-action"
            disabled={!canStartReview}
            isLoading={reviewStartProgress.isPending}
            idleLabel={BUYER_START_ARCHITECTURE_REVIEW_CTA}
            loadingLabel={reviewStartProgress.loadingLabel}
            onClick={() => {
              void handleStartReview();
            }}
            data-testid="architecture-start-review"
          />
        )}
      </ArchitectureDraftWorkspaceSaveActions>
      {reviewStartProgress.stageId !== null ? (
        <ReviewStartStagedProgress
          stages={reviewStartProgress.stages}
          activeStageId={reviewStartProgress.stageId}
          headline={reviewStartProgress.loadingLabel}
          detail={reviewStartProgress.waitCopy.detail}
          testId="architecture-start-review-progress"
        />
      ) : null}
      {reviewStartProgress.stalled ? (
        <ReviewStartNavigationStallNotice
          href={startReviewFromArchitectureHref(effectiveArchitectureId)}
          testId="architecture-start-review-stall"
        />
      ) : null}
    </div>
    <ArchitectureDraftQualityAttributesEncouragementDialog
      open={qualityAttributesEncouragementOpen}
      busy={reviewStartProgress.isPending}
      onOpenChange={setQualityAttributesEncouragementOpen}
      onAddQualityAttributes={handleEncourageAddQualityAttributes}
      onContinueWithout={handleContinueWithoutQualityAttributes}
    />
    {nextDraft !== null ? <ArchitectureDraftNextDraftFooter target={nextDraft} /> : null}
  </div>
);
}
