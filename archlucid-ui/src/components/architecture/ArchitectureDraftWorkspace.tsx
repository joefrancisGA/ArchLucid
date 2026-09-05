"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

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
import { useInAppNavigationGuard } from "@/hooks/use-in-app-navigation-guard";
import { InAppNavigationGuardDialog } from "@/components/navigation/InAppNavigationGuardDialog";
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
import { parseScopeGateOpenFromSearch, scopeGateHrefFromSearch } from "@/lib/architecture/scope-gate-url";
import { isApiRequestError } from "@/lib/api-request-error";
import { reopenDraftRequest } from "@/lib/api/draft-intake-api";
import {
  architectureDraftAllowsBriefUnlock,
  isArchitectureDraftBriefFrozen,
  isArchitectureDraftInReviewIntake,
} from "@/lib/architecture/architecture-draft-intake-mode";
import { buyerFacingReviewTitleFromSummary } from "@/lib/buyer/buyer-facing-review-title";
import {
  extractScopeUnderstandingLinesFromBrief,
  mergeScopeBulletsIntoBrief,
  scopeUnderstandingFingerprint,
  type ScopeUnderstandingBullet,
} from "@/lib/architecture/architecture-scope-understanding-check";
import { resolveNextArchitectureDraftInList } from "@/lib/resolve-next-architecture-draft-in-list";
import { ReviewStartInlineError } from "@/components/review-intake/ReviewStartInlineError";
import type { ActorSet, DraftRequestResponse } from "@/types/draft-intake";

import { ArchitectureDraftWorkspaceBody } from "@/components/architecture/ArchitectureDraftWorkspaceBody";
import { useArchitectureDraftWorkspaceEffects } from "@/components/architecture/ArchitectureDraftWorkspaceEffects";

type ArchitectureDraftWorkspaceProps = {
  readonly architectureId: string;
};

/** Long-lived architecture draft editor — save and resume without starting a review. */
export function ArchitectureDraftWorkspace(props: ArchitectureDraftWorkspaceProps): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname() ?? `/architecture/architectures/${encodeURIComponent(props.architectureId)}`;
  const searchParams = useSearchParams();
  const urlScopeGateOpen = parseScopeGateOpenFromSearch(searchParams.get("scopeGate"));
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
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [scopeGateOpen, setScopeGateOpenState] = useState(urlScopeGateOpen);
  const [scopeBullets, setScopeBullets] = useState<ScopeUnderstandingBullet[]>([]);

  const setScopeGateOpen = useCallback(
    (next: boolean | ((open: boolean) => boolean)) => {
      setScopeGateOpenState((current) => {
        const resolved = typeof next === "function" ? next(current) : next;

        router.replace(scopeGateHrefFromSearch(searchParams.toString(), resolved, pathname), { scroll: false });

        return resolved;
      });
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    setScopeGateOpenState(urlScopeGateOpen);
  }, [urlScopeGateOpen]);

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

  const handleNewDraftRecoveryHydrated = useCallback(
    (snapshot: { readonly fields: ArchitectureDraftFieldState; readonly actorSet: ActorSet }) => {
      setFields(snapshot.fields);
      setActorSet(snapshot.actorSet);
    },
    [setActorSet, setFields],
  );

  const {
    saveState,
    conflictMessage,
    saveDraft,
    reloadDraft,
    acceptServerBaseline,
    syncServerUpdatedUtc,
    hasPersistedDraft,
  } = useArchitectureDraftAutosave({
      architectureId: props.architectureId,
      fields,
      actorSet,
      enabled: !handoffEditorLocked && !briefFrozen,
      deferCreateUntilFirstSave: isNewDraft,
      scopeGateOpen,
      scopeBullets,
      onDraftCreated: isNewDraft ? handleDraftCreated : undefined,
      onDraftLoaded: handleDraftLoaded,
      onImmutableDraftDetected: handleImmutableDraftDetected,
      onNewDraftRecoveryHydrated: isNewDraft ? handleNewDraftRecoveryHydrated : undefined,
    });

  acceptServerBaselineRef.current = acceptServerBaseline;

  const persistedScopeFingerprint = useMemo(() => {
    const persistedLines = extractScopeUnderstandingLinesFromBrief(draft?.document.freeTextIntent);

    if (persistedLines.length === 0) {
      return null;
    }

    return scopeUnderstandingFingerprint(persistedLines);
  }, [draft?.document.freeTextIntent]);

  const {
    reviewReadiness,
    draftStartReviewSteps,
    draftStartReviewEmphasizedStepId,
    needsPersistedDraftBeforeStart,
    canStartReview,
    setActorSuggestionsUnresolved,
    actorSuggestionsUnresolved,
    actorSuggestionGateRequestId,
    startReviewError,
    qualityAttributesEncouragementOpen,
    setQualityAttributesEncouragementOpen,
    reviewStartProgress,
    handleStartReview,
    handleEncourageAddQualityAttributes,
    handleContinueWithoutQualityAttributes,
    persistScopeConfirmation,
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
    syncServerUpdatedUtc,
    scopeGateOpen,
    setScopeGateOpen,
    scopeBullets,
    setScopeBullets,
    persistedScopeFingerprint,
  });

  const showWorkspaceFirstReviewProgress = usePersistentWorkspaceNextActionStripVisible();
  const draftStartReviewChecklistDescription = resolveArchitectureDraftStartReviewChecklistDescription(
    showWorkspaceFirstReviewProgress,
  );

  const hasUnsavedChanges = saveState === "unsaved" || saveState === "saving" || saveState === "error";
  useUnsavedChangesGuard({ when: hasUnsavedChanges && !editorLocked });
  const inAppNavigationGuard = useInAppNavigationGuard({
    when: hasUnsavedChanges && !editorLocked,
    message: "You have unsaved architecture changes.",
  });

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
        label: actor.label,
        kind: actor.kind,
        trustOrigin: actor.trustOrigin,
        contract: actor.contract,
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
    saveState,
    effectiveArchitectureId,
    applyLoadedDraftToForm,
    acceptServerBaselineRef,
  });

  const handleScopeConfirmed = useCallback(
    async (bullets: ScopeUnderstandingBullet[]) => {
      const persisted = await persistScopeConfirmation(bullets);

      if (persisted && draft !== null) {
        setDraft({
          ...draft,
          document: {
            ...draft.document,
            freeTextIntent: mergeScopeBulletsIntoBrief(bullets, fields.freeTextIntent),
          },
        });
      }

      return persisted;
    },
    [draft, fields.freeTextIntent, persistScopeConfirmation, setDraft],
  );

  const handleUnlockBrief = useCallback(async () => {
    if (!canUnlockBrief || draft === null) {
      return;
    }

    setUnlockBusy(true);
    setUnlockError(null);

    try {
      const reopened = await reopenDraftRequest(draft.draftId);
      handleDraftLoaded(reopened);
    } catch (error) {
      setUnlockError(
        isApiRequestError(error)
          ? error.message
          : "Could not unlock this architecture. Try again.",
      );
    } finally {
      setUnlockBusy(false);
    }
  }, [canUnlockBrief, draft, handleDraftLoaded]);

  return (
    <>
      <InAppNavigationGuardDialog
        open={inAppNavigationGuard.dialogOpen}
        message={inAppNavigationGuard.dialogMessage}
        onConfirmLeave={inAppNavigationGuard.confirmLeave}
        onCancelLeave={inAppNavigationGuard.cancelLeave}
      />
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
      unlockError={unlockError}
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
      persistedScopeFingerprint={persistedScopeFingerprint}
      persistScopeConfirmation={handleScopeConfirmed}
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
      saveDraft={saveDraft}
      setExitPending={setExitPending}
      hasPersistedDraft={hasPersistedDraft}
      qualityAttributesEncouragementOpen={qualityAttributesEncouragementOpen}
      setQualityAttributesEncouragementOpen={setQualityAttributesEncouragementOpen}
      handleEncourageAddQualityAttributes={handleEncourageAddQualityAttributes}
      handleContinueWithoutQualityAttributes={handleContinueWithoutQualityAttributes}
      nextDraft={nextDraft}
    />
    </>
  );
}
