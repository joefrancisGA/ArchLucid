"use client";

import Link from "next/link";

import { ArchitectureDraftNextDraftFooter } from "@/components/architecture/ArchitectureDraftNextDraftFooter";
import { ArchitectureDraftQualityAttributesEncouragementDialog } from "@/components/architecture/ArchitectureDraftQualityAttributesEncouragementDialog";
import { ArchitectureDraftStartReviewGate } from "@/components/architecture/ArchitectureDraftStartReviewGate";
import { ArchitectureDraftWorkspaceSaveActions } from "@/components/architecture/ArchitectureDraftWorkspaceSaveActions";
import { ArchitectureScopeUnderstandingCheckPanel } from "@/components/architecture/ArchitectureScopeUnderstandingCheckPanel";
import { OperatorMutationInlineError } from "@/components/operator/OperatorMutationInlineError";
import { PreExecuteCostEstimateNotice } from "@/components/usability/PreExecuteCostEstimateNotice";
import { Button } from "@/components/ui/button";
import { ReviewStartLoadingButton } from "@/components/review-intake/ReviewStartLoadingButton";
import { ReviewStartNavigationStallNotice } from "@/components/review-intake/ReviewStartNavigationStallNotice";
import { ReviewStartStagedProgress } from "@/components/review-intake/ReviewStartStagedProgress";
import {
  ARCHITECTURE_DRAFT_INTAKE_MODE_CONTINUE_LABEL,
} from "@/lib/architecture/architecture-draft-intake-mode";
import { resolveArchitectureReviewHref, startReviewFromArchitectureHref } from "@/lib/architecture/architecture-routes";
import { BUYER_START_ARCHITECTURE_REVIEW_CTA } from "@/lib/buyer/buyer-polish-copy";
import type { ArchitectureDraftWorkspaceBodyProps } from "./ArchitectureDraftWorkspaceBody";

type ArchitectureDraftWorkspaceStartReviewFooterProps = Pick<
  ArchitectureDraftWorkspaceBodyProps,
  | "linkedReviewId"
  | "briefFrozen"
  | "reviewReadiness"
  | "needsPersistedDraftBeforeStart"
  | "scopeGateOpen"
  | "actorSuggestionsUnresolved"
  | "startReviewError"
  | "editorLocked"
  | "saveState"
  | "conflictMessage"
  | "isNewDraft"
  | "hasPersistedDraft"
  | "fields"
  | "saveDraft"
  | "setExitPending"
  | "intakeModeActive"
  | "effectiveDraftId"
  | "parentArchitectureId"
  | "canStartReview"
  | "reviewStartProgress"
  | "handleStartReview"
  | "scopeUnderstandingInput"
  | "persistedScopeFingerprint"
  | "persistScopeConfirmation"
  | "setScopeBullets"
  | "setScopeGateOpen"
  | "handoffEditorLocked"
  | "exitPending"
  | "qualityAttributesEncouragementOpen"
  | "setQualityAttributesEncouragementOpen"
  | "handleEncourageAddQualityAttributes"
  | "handleContinueWithoutQualityAttributes"
  | "nextDraft"
>;

export function ArchitectureDraftWorkspaceStartReviewFooter(
  props: ArchitectureDraftWorkspaceStartReviewFooterProps,
): React.JSX.Element {
  const {
    linkedReviewId,
    briefFrozen,
    reviewReadiness,
    needsPersistedDraftBeforeStart,
    scopeGateOpen,
    actorSuggestionsUnresolved,
    startReviewError,
    editorLocked,
    saveState,
    conflictMessage,
    isNewDraft,
    hasPersistedDraft,
    fields,
    saveDraft,
    setExitPending,
    intakeModeActive,
    effectiveDraftId,
    parentArchitectureId,
    canStartReview,
    reviewStartProgress,
    handleStartReview,
    scopeUnderstandingInput,
    persistedScopeFingerprint,
    persistScopeConfirmation,
    setScopeBullets,
    setScopeGateOpen,
    handoffEditorLocked,
    exitPending,
    qualityAttributesEncouragementOpen,
    setQualityAttributesEncouragementOpen,
    handleEncourageAddQualityAttributes,
    handleContinueWithoutQualityAttributes,
    nextDraft,
  } = props;

  const startReviewArchitectureId = parentArchitectureId?.trim() ?? effectiveDraftId;

  return (
    <>
      {linkedReviewId === null && !briefFrozen ? (
        <ArchitectureScopeUnderstandingCheckPanel
          input={scopeUnderstandingInput}
          disabled={handoffEditorLocked || exitPending || reviewStartProgress.isPending}
          draftSaveState={saveState}
          persistedScopeFingerprint={persistedScopeFingerprint}
          showReadyHint={false}
          onConfirm={persistScopeConfirmation}
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
          structuredBrief={fields.structuredBrief}
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
              <Link href={startReviewFromArchitectureHref(startReviewArchitectureId)}>
                {ARCHITECTURE_DRAFT_INTAKE_MODE_CONTINUE_LABEL}
              </Link>
            </Button>
          ) : linkedReviewId !== null ? (
            <Button type="button" variant="primary" size="sm" asChild data-testid="architecture-continue-review">
              <Link href={resolveArchitectureReviewHref(linkedReviewId, parentArchitectureId)}>Continue in review</Link>
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
            href={startReviewFromArchitectureHref(startReviewArchitectureId)}
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
    </>
  );
}
