"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

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
import { PreExecuteCostEstimateNotice } from "@/components/usability/PreExecuteCostEstimateNotice";
import { Button } from "@/components/ui/button";
import { ReviewStartLoadingButton } from "@/components/review-intake/ReviewStartLoadingButton";
import { ReviewStartNavigationStallNotice } from "@/components/review-intake/ReviewStartNavigationStallNotice";
import { ReviewStartStagedProgress } from "@/components/review-intake/ReviewStartStagedProgress";
import { Card, CardContent } from "@/components/ui/card";
import { useArchitectureDraftAutosave, type ArchitectureDraftSaveState } from "@/hooks/use-architecture-draft-autosave";
import { useArchitectureDraftRegistryEntries } from "@/hooks/use-architecture-draft-registry-entries";
import {
  ARCHITECTURE_DRAFT_START_REVIEW_CHECKLIST_DESCRIPTION,
  ARCHITECTURE_DRAFT_START_REVIEW_CHECKLIST_TITLE,
} from "@/lib/architecture-draft-start-review-checklist";
import { useArchitectureDraftStartReview } from "@/hooks/use-architecture-draft-start-review";
import { useArchitectureDraftWorkspace } from "@/hooks/use-architecture-draft-workspace";
import { useRunSummaryQuery } from "@/hooks/use-run-summary-query";
import { useUnsavedChangesGuard } from "@/hooks/use-unsaved-changes-guard";
import {
  acknowledgeArchitectureDraftHandoff,
  architectureDraftSpawnedRunId,
  trackArchitectureDraftPostSpawnEdit,
} from "@/lib/architecture/architecture-draft-handoff-gate";
import { architectureDraftDisplayName } from "@/lib/architecture/architecture-draft-status";
import {
  buildArchitectureDraftRegistryEntry,
  upsertArchitectureDraftRegistryEntry,
} from "@/lib/architecture/architecture-draft-registry";
import { type ArchitectureDraftFieldState } from "@/lib/architecture/architecture-draft-readiness";
import { architectureDraftDetailPageSubtitle } from "@/lib/architecture/architecture-draft-detail-page-copy";
import { actorSetFromDraftDocument } from "@/lib/architecture/architecture-creation-init";
import { reviewDetailPath, startReviewFromArchitectureHref, ARCHITECTURE_NEW_DRAFT_SEGMENT } from "@/lib/architecture/architecture-routes";
import { retargetAdvisoryDraftInFlightArchitecture } from "@/lib/operations/advisory-draft-in-flight";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { isApiRequestError } from "@/lib/api-request-error";
import { getDraftRequest, reopenDraftRequest } from "@/lib/api/draft-intake-api";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import { OPERATOR_QUERY_STALE_MS } from "@/lib/query/operator-query-stale-time";
import {
  ARCHITECTURE_DRAFT_INTAKE_MODE_CONTINUE_LABEL,
  architectureDraftAllowsBriefUnlock,
  isArchitectureDraftBriefFrozen,
  isArchitectureDraftInReviewIntake,
} from "@/lib/architecture/architecture-draft-intake-mode";
import { buyerFacingReviewTitleFromSummary } from "@/lib/buyer/buyer-facing-review-title";
import { GuidedIntakeAlreadySubmittedCallout } from "@/app/(operator)/architecture/reviews/new/GuidedIntakeAlreadySubmittedCallout";
import { resolveNextArchitectureDraftInList } from "@/lib/resolve-next-architecture-draft-in-list";
import { BUYER_START_ARCHITECTURE_REVIEW_CTA } from "@/lib/buyer/buyer-polish-copy";
import { OPERATOR_LINK, OPERATOR_PAGE_LEAD_MEASURE, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { showError, showSuccess } from "@/lib/toast";
import { cn } from "@/lib/utils";
import type { ActorSet, DraftRequestResponse } from "@/types/draft-intake";

const ArchitectureDraftAiRefinePanel = dynamic(
  async () => {
    const module = await import("@/components/architecture/ArchitectureDraftAiRefinePanel");

    return module.ArchitectureDraftAiRefinePanel;
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

const DraftIntakeAdvancedSection = dynamic(
  async () => {
    const module = await import("@/components/draft-intake/DraftIntakeAdvancedSection");

    return module.DraftIntakeAdvancedSection;
  },
  { loading: () => null },
);

type ArchitectureDraftWorkspaceProps = {
  readonly architectureId: string;
};

/** Long-lived architecture draft editor — save and resume without starting a review. */
export function ArchitectureDraftWorkspace(props: ArchitectureDraftWorkspaceProps): React.JSX.Element {
  const queryClient = useQueryClient();
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
  const previousSaveStateRef = useRef<ArchitectureDraftSaveState>("saved");
  const syncDraftInFlightRef = useRef<Promise<void> | null>(null);
  const draftLifecycleRef = useRef<{
    status: DraftRequestResponse["status"] | null;
    spawnedRunId: string | null;
  }>({
    status: null,
    spawnedRunId: null,
  });
  const loadDraftRef = useRef(loadDraft);

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

  // Reasoning needs a real draft id — unavailable on /new until the first deferred create succeeds.
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

  const hasUnsavedChanges = saveState === "unsaved" || saveState === "saving" || saveState === "error";
  useUnsavedChangesGuard({ when: hasUnsavedChanges && !editorLocked });

  const displayName = useMemo(
    () => architectureDraftDisplayName(fields.systemName, fields.freeTextIntent),
    [fields.freeTextIntent, fields.systemName],
  );

  const workspaceHeading = displayName;
  const workspaceLead = architectureDraftDetailPageSubtitle(buyerPolishedShell);

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

  loadDraftRef.current = loadDraft;

  useEffect(() => {
    draftLifecycleRef.current = {
      status: draft?.status ?? null,
      spawnedRunId: architectureDraftSpawnedRunId(draft),
    };
  }, [draft]);

  const syncDraftFromServer = useCallback(async () => {
    if (isNewDraft || loading) {
      return;
    }

    if (syncDraftInFlightRef.current !== null) {
      return syncDraftInFlightRef.current;
    }

    const syncPromise = (async () => {
      try {
        const loaded = await queryClient.fetchQuery({
          queryKey: operatorQueryKeys.architectureDraft(props.architectureId),
          queryFn: () => getDraftRequest(props.architectureId),
          staleTime: OPERATOR_QUERY_STALE_MS,
        });
        const prior = draftLifecycleRef.current;
        const nextSpawnedRunId = architectureDraftSpawnedRunId(loaded);

        // Tab focus is frequent; skip a form reset when intake/spawn state did not change.
        if (prior.status === loaded.status && prior.spawnedRunId === nextSpawnedRunId) {
          return;
        }

        const formState = applyLoadedDraftToForm(loaded);
        acceptServerBaselineRef.current(
        formState,
        loaded.updatedUtc,
        actorSetFromDraftDocument(loaded),
      );
        upsertArchitectureDraftRegistryEntry(
          buildArchitectureDraftRegistryEntry(loaded, {
            linkedReviewId: nextSpawnedRunId,
          }),
        );
      } catch {
        // Background sync must not disrupt the workspace on transient network failures.
      }
    })();

    syncDraftInFlightRef.current = syncPromise;

    try {
      await syncPromise;
    } finally {
      if (syncDraftInFlightRef.current === syncPromise) {
        syncDraftInFlightRef.current = null;
      }
    }
  }, [applyLoadedDraftToForm, isNewDraft, loading, props.architectureId, queryClient]);

  useEffect(() => {
    if (isNewDraft) {
      return;
    }

    function handleResume() {
      if (document.visibilityState !== "visible") {
        return;
      }

      void syncDraftFromServer();
    }

    document.addEventListener("visibilitychange", handleResume);
    window.addEventListener("focus", handleResume);

    return () => {
      document.removeEventListener("visibilitychange", handleResume);
      window.removeEventListener("focus", handleResume);
    };
  }, [isNewDraft, syncDraftFromServer]);

  useEffect(() => {
    if (
      linkedReviewId !== null &&
      handoffAcknowledged &&
      previousSaveStateRef.current === "saving" &&
      saveState === "saved"
    ) {
      trackArchitectureDraftPostSpawnEdit(effectiveArchitectureId, linkedReviewId);
    }

    previousSaveStateRef.current = saveState;
  }, [effectiveArchitectureId, handoffAcknowledged, linkedReviewId, saveState]);

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
              {workspaceLead}
            </p>
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
          onUnlock={() => {
            void handleUnlockBrief();
          }}
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
              void reloadDraft();
            }}
            data-testid="architecture-draft-conflict-refresh"
          >
            Refresh draft
          </Button>
        </div>
      ) : null}

      <IntegrationConnectChecklist
        title={ARCHITECTURE_DRAFT_START_REVIEW_CHECKLIST_TITLE}
        description={ARCHITECTURE_DRAFT_START_REVIEW_CHECKLIST_DESCRIPTION}
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
