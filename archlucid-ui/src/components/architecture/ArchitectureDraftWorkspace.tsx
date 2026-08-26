"use client";

import { useCallback, useMemo, useRef, useState } from "react";

import { useArchitectureDraftAutosave } from "@/hooks/use-architecture-draft-autosave";
import { useArchitectureDraftRegistryEntries } from "@/hooks/use-architecture-draft-registry-entries";
import {
  resolveArchitectureDraftStartReviewChecklistDescription,
} from "@/lib/architecture-draft-start-review-checklist";
import { usePersistentWorkspaceNextActionStripVisible } from "@/lib/use-persistent-workspace-next-action-strip-visible";
import { useArchitectureDraftStartReview } from "@/hooks/use-architecture-draft-start-review";
import { useArchitectureDraftWorkspace } from "@/hooks/use-architecture-draft-workspace";
import { useRunSummaryQuery } from "@/hooks/use-run-summary-query";
import { useUnsavedChangesGuard } from "@/hooks/use-unsaved-changes-guard";
import {
  acknowledgeArchitectureDraftHandoff,
} from "@/lib/architecture/architecture-draft-handoff-gate";
import { architectureDraftDisplayName } from "@/lib/architecture/architecture-draft-status";
import { type ArchitectureDraftFieldState } from "@/lib/architecture/architecture-draft-readiness";
import { architectureDraftDetailPageSubtitle } from "@/lib/architecture/architecture-draft-detail-page-copy";
import { actorSetFromDraftDocument } from "@/lib/architecture/architecture-creation-init";
import { ARCHITECTURE_NEW_DRAFT_SEGMENT } from "@/lib/architecture/architecture-routes";
import {
  writeArchitectureCreationDraftId,
  replaceArchitectureCreationUrlWithoutNavigation,
} from "@/lib/architecture/architecture-creation-session";
import { retargetAdvisoryDraftInFlightArchitecture } from "@/lib/operations/advisory-draft-in-flight";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { isApiRequestError } from "@/lib/api-request-error";
import { reopenDraftRequest } from "@/lib/api/draft-intake-api";
import {
  architectureDraftAllowsBriefUnlock,
  isArchitectureDraftBriefFrozen,
  isArchitectureDraftInReviewIntake,
} from "@/lib/architecture/architecture-draft-intake-mode";
import { buyerFacingReviewTitleFromSummary } from "@/lib/buyer/buyer-facing-review-title";
import { resolveNextArchitectureDraftInList } from "@/lib/resolve-next-architecture-draft-in-list";
import { showError, showSuccess } from "@/lib/toast";
import type { ActorSet, DraftRequestResponse } from "@/types/draft-intake";

import { ArchitectureDraftWorkspaceBody } from "@/components/architecture/ArchitectureDraftWorkspaceBody";
import { useArchitectureDraftWorkspaceEffects } from "@/components/architecture/ArchitectureDraftWorkspaceEffects";

type ArchitectureDraftWorkspaceProps = {
  readonly architectureId: string;
};

/** Long-lived architecture draft editor — save and resume without starting a review. */
export function ArchitectureDraftWorkspace(props: ArchitectureDraftWorkspaceProps): React.JSX.Element {
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const draftRegistryEntries = useArchitectureDraftRegistryEntries();
  const acceptServerBaselineRef = useRef<
    (fields: ArchitectureDraftFieldState, serverUpdatedUtc: string, actorSet: ActorSet) => void
  >(() => undefined);
  const onDraftHydratedRef = useRef<(loaded: DraftRequestResponse, formState: ArchitectureDraftFieldState) => void>(
    (loaded, formState) => {
      acceptServerBaselineRef.current(formState, loaded.updatedUtc, actorSetFromDraftDocument(loaded));
    },
  );
  const {
    isNewDraft,
    loading,
    loadError,
    draft,
    setDraft,
    fields,
    setFields,
    actorSet,
    setActorSet,
    handoffAcknowledged,
    setHandoffAcknowledged,
    resolvedDraftId,
    setResolvedDraftId,
    linkedReviewId,
    handoffEditorLocked,
    blocksLlmExecution,
    loadDraft,
    applyLoadedDraftToForm,
  } = useArchitectureDraftWorkspace({
    architectureId: props.architectureId,
    onDraftHydratedRef,
  });
  const [exitPending, setExitPending] = useState(false);
  const [unlockBusy, setUnlockBusy] = useState(false);
  const isDetailDraft = !isNewDraft;
  const linkedReviewSummaryQuery = useRunSummaryQuery(linkedReviewId ?? "", {
    enabled: linkedReviewId !== null,
  });
  const linkedReviewTitle = useMemo(() => {
    if (linkedReviewId === null) {
      return "Untitled review";
    }

    if (linkedReviewSummaryQuery.data !== undefined) {
      return buyerFacingReviewTitleFromSummary(linkedReviewSummaryQuery.data);
    }

    if (linkedReviewSummaryQuery.isError) {
      return linkedReviewId;
    }

    return "Untitled review";
  }, [linkedReviewId, linkedReviewSummaryQuery.data, linkedReviewSummaryQuery.isError]);
  const intakeModeActive = isArchitectureDraftInReviewIntake(draft?.status);
  const briefFrozen = isArchitectureDraftBriefFrozen(draft?.status);
  const canUnlockBrief = architectureDraftAllowsBriefUnlock(draft?.status);
  const editorLocked = handoffEditorLocked || briefFrozen || exitPending;
  const effectiveArchitectureId = resolvedDraftId ?? props.architectureId;
  const nextDraft = useMemo(() => {
    if (isNewDraft) {
      return null;
    }

    return resolveNextArchitectureDraftInList(draftRegistryEntries, effectiveArchitectureId);
  }, [draftRegistryEntries, effectiveArchitectureId, isNewDraft]);
  const refinementDraftId =
    draft?.draftId?.trim() || resolvedDraftId || (isNewDraft ? null : props.architectureId.trim() || null);

  const handleDraftCreated = useCallback(
    (draftId: string) => {
      writeArchitectureCreationDraftId(draftId);
      setResolvedDraftId(draftId);
      replaceArchitectureCreationUrlWithoutNavigation(draftId);
      retargetAdvisoryDraftInFlightArchitecture(ARCHITECTURE_NEW_DRAFT_SEGMENT, draftId);
    },
    [setResolvedDraftId],
  );

  const handleDraftLoaded = useCallback(
    (loaded: DraftRequestResponse) => {
      const formState = applyLoadedDraftToForm(loaded);
      acceptServerBaselineRef.current(
        formState,
        loaded.updatedUtc,
        actorSetFromDraftDocument(loaded),
      );
    },
    [applyLoadedDraftToForm],
  );

  const handleImmutableDraftDetected = useCallback((loaded: DraftRequestResponse) => {
    setDraft(loaded);
  }, [setDraft]);

  const { saveState, conflictMessage, saveDraft, reloadDraft, acceptServerBaseline, hasPersistedDraft } =
    useArchitectureDraftAutosave({
      architectureId: props.architectureId,
      fields,
      actorSet,
      enabled: !handoffEditorLocked && !briefFrozen,
      deferCreateUntilFirstSave: isNewDraft,
      onDraftCreated: isNewDraft ? handleDraftCreated : undefined,
      onDraftLoaded: handleDraftLoaded,
      onImmutableDraftDetected: handleImmutableDraftDetected,
    });

  acceptServerBaselineRef.current = acceptServerBaseline;

  const {
    reviewReadiness,
    draftStartReviewSteps,
    draftStartReviewEmphasizedStepId,
    needsPersistedDraftBeforeStart,
    canStartReview,
    scopeGateOpen,
    setScopeGateOpen,
    setScopeBullets,
    actorSuggestionsUnresolved,
    setActorSuggestionsUnresolved,
    actorSuggestionGateRequestId,
    startReviewError,
    qualityAttributesEncouragementOpen,
    setQualityAttributesEncouragementOpen,
    reviewStartProgress,
    handleStartReview,
    handleEncourageAddQualityAttributes,
    handleContinueWithoutQualityAttributes,
  } = useArchitectureDraftStartReview({
    isNewDraft,
    hasPersistedDraft,
    briefFrozen,
    linkedReviewId,
    effectiveArchitectureId,
    fields,
    actorSet,
    draft,
    saveState,
    conflictMessage,
    saveDraft,
  });

  const showWorkspaceFirstReviewProgress = usePersistentWorkspaceNextActionStripVisible();
  const draftStartReviewChecklistDescription = resolveArchitectureDraftStartReviewChecklistDescription(
    showWorkspaceFirstReviewProgress,
  );

  const hasUnsavedChanges = saveState === "unsaved" || saveState === "saving" || saveState === "error";
  useUnsavedChangesGuard({ when: hasUnsavedChanges && !editorLocked });

  const displayName = useMemo(
    () => architectureDraftDisplayName(fields.systemName, fields.freeTextIntent),
    [fields.freeTextIntent, fields.systemName],
  );

  const workspaceHeading = displayName;
  const workspaceLead = architectureDraftDetailPageSubtitle(buyerPolishedShell, reviewReadiness.isValid);

  const scopeUnderstandingInput = useMemo(
    () => ({
      architectureName: fields.systemName,
      businessOutcome: fields.businessOutcome,
      architectureOverview: fields.freeTextIntent,
      intentText: fields.freeTextIntent,
      peopleAndSystems: actorSet.actors.map((actor) => ({
        label: actor.label?.trim() || actor.kind,
        kind: actor.kind,
      })),
    }),
    [actorSet.actors, fields.businessOutcome, fields.freeTextIntent, fields.systemName],
  );

  useArchitectureDraftWorkspaceEffects({
    architectureId: props.architectureId,
    isNewDraft,
    loading,
    draft,
    linkedReviewId,
    handoffAcknowledged,
    saveState,
    effectiveArchitectureId,
    applyLoadedDraftToForm,
    acceptServerBaselineRef,
  });

  const handleAcknowledgeHandoff = useCallback(() => {
    if (linkedReviewId === null) {
      return;
    }

    acknowledgeArchitectureDraftHandoff(effectiveArchitectureId, linkedReviewId);
    setHandoffAcknowledged(true);
  }, [effectiveArchitectureId, linkedReviewId, setHandoffAcknowledged]);

  const handleUnlockBrief = useCallback(async () => {
    if (!canUnlockBrief || draft === null) {
      return;
    }

    setUnlockBusy(true);

    try {
      const reopened = await reopenDraftRequest(draft.draftId);
      handleDraftLoaded(reopened);
      showSuccess("Architecture unlocked — you can edit the brief.");
    } catch (error) {
      showError(
        "Could not unlock this architecture",
        isApiRequestError(error) ? error.message : undefined,
      );
    } finally {
      setUnlockBusy(false);
    }
  }, [canUnlockBrief, draft, handleDraftLoaded]);

  return (
    <ArchitectureDraftWorkspaceBody
      architectureId={props.architectureId}
      loading={loading}
      loadError={loadError}
      isNewDraft={isNewDraft}
      isDetailDraft={isDetailDraft}
      buyerPolishedShell={buyerPolishedShell}
      workspaceHeading={workspaceHeading}
      workspaceLead={workspaceLead}
      linkedReviewId={linkedReviewId}
      linkedReviewTitle={linkedReviewTitle}
      intakeModeActive={intakeModeActive}
      briefFrozen={briefFrozen}
      canUnlockBrief={canUnlockBrief}
      unlockBusy={unlockBusy}
      onUnlockBrief={() => {
        void handleUnlockBrief();
      }}
      draft={draft}
      conflictMessage={conflictMessage}
      onReloadDraft={() => {
        void reloadDraft();
      }}
      onLoadDraft={loadDraft}
      draftStartReviewChecklistDescription={draftStartReviewChecklistDescription}
      draftStartReviewSteps={draftStartReviewSteps}
      draftStartReviewEmphasizedStepId={draftStartReviewEmphasizedStepId}
      fields={fields}
      actorSet={actorSet}
      editorLocked={editorLocked}
      handoffEditorLocked={handoffEditorLocked}
      blocksLlmExecution={blocksLlmExecution}
      effectiveArchitectureId={effectiveArchitectureId}
      reviewReadiness={reviewReadiness}
      needsPersistedDraftBeforeStart={needsPersistedDraftBeforeStart}
      scopeGateOpen={scopeGateOpen}
      actorSuggestionsUnresolved={actorSuggestionsUnresolved}
      startReviewError={startReviewError}
      saveState={saveState}
      scopeUnderstandingInput={scopeUnderstandingInput}
      setScopeBullets={setScopeBullets}
      setScopeGateOpen={setScopeGateOpen}
      setActorSuggestionsUnresolved={setActorSuggestionsUnresolved}
      actorSuggestionGateRequestId={actorSuggestionGateRequestId}
      setFields={setFields}
      setActorSet={setActorSet}
      refinementDraftId={refinementDraftId}
      exitPending={exitPending}
      reviewStartProgress={reviewStartProgress}
      canStartReview={canStartReview}
      handleStartReview={handleStartReview}
      handleAcknowledgeHandoff={handleAcknowledgeHandoff}
      saveDraft={saveDraft}
      setExitPending={setExitPending}
      hasPersistedDraft={hasPersistedDraft}
      qualityAttributesEncouragementOpen={qualityAttributesEncouragementOpen}
      setQualityAttributesEncouragementOpen={setQualityAttributesEncouragementOpen}
      handleEncourageAddQualityAttributes={handleEncourageAddQualityAttributes}
      handleContinueWithoutQualityAttributes={handleContinueWithoutQualityAttributes}
      nextDraft={nextDraft}
    />
  );
}
