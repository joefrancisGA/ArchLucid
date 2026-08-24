"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { ArchitectureDraftDetailBreadcrumb } from "@/app/(operator)/architecture/architectures/_sections/ArchitectureDraftDetailBreadcrumb";
import { ArchitectureDraftDetailBuyerChrome } from "@/app/(operator)/architecture/architectures/_sections/ArchitectureDraftDetailBuyerChrome";
import { ArchitectureCreationLocalDraftsPanel } from "@/components/architecture/ArchitectureCreationLocalDraftsPanel";
import { ArchitectureDraftAiRefinePanel } from "@/components/architecture/ArchitectureDraftAiRefinePanel";
import { ArchitectureDraftDeleteControl } from "@/components/architecture/ArchitectureDraftDeleteControl";
import { ArchitectureDraftDetailLoadFailure } from "@/components/architecture/ArchitectureDraftDetailLoadFailure";
import { ArchitectureDraftFormFields } from "@/components/architecture/ArchitectureDraftFormFields";
import { ArchitectureDraftGuidanceDisclosure } from "@/components/architecture/ArchitectureDraftGuidanceDisclosure";
import { ArchitectureDraftHandoffBanner } from "@/components/architecture/ArchitectureDraftHandoffBanner";
import { ArchitectureDraftIntakeModeBanner } from "@/components/architecture/ArchitectureDraftIntakeModeBanner";
import { ArchitectureScopeUnderstandingCheckPanel } from "@/components/architecture/ArchitectureScopeUnderstandingCheckPanel";
import { ArchitectureDraftWorkspaceLoadingSkeleton } from "@/components/architecture/ArchitectureDraftWorkspaceLoadingSkeleton";
import { AiBudgetSpendNotice } from "@/components/ai-budget/AiBudgetSpendNotice";
import { DraftIntakeAdvancedSection } from "@/components/draft-intake/DraftIntakeAdvancedSection";
import { DraftIntakeReasoningPanel } from "@/components/draft-intake/DraftIntakeReasoningPanel";
import { OperatorMutationInlineError } from "@/components/operator/OperatorMutationInlineError";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { PreExecuteCostEstimateNotice } from "@/components/usability/PreExecuteCostEstimateNotice";
import { Button } from "@/components/ui/button";
import { ReviewStartLoadingButton } from "@/components/review-intake/ReviewStartLoadingButton";
import { ReviewStartNavigationStallNotice } from "@/components/review-intake/ReviewStartNavigationStallNotice";
import { ReviewStartStagedProgress } from "@/components/review-intake/ReviewStartStagedProgress";
import { Card, CardContent } from "@/components/ui/card";
import { useArchitectureDraftAutosave, type ArchitectureDraftSaveState } from "@/hooks/use-architecture-draft-autosave";
import { useLlmMonthlyBudgetExecutionGate } from "@/hooks/use-llm-monthly-budget-execution-gate";
import { useReviewStartNavigationProgress } from "@/hooks/use-review-start-navigation-progress";
import { SOFT_NAVIGATION_TIMEOUT_MS } from "@/hooks/use-soft-navigation-loading";
import { useUnsavedChangesGuard } from "@/hooks/use-unsaved-changes-guard";
import {
  applyArchitectureCreationDraftToFormState,
  architectureCreationDefaultActorSet,
} from "@/lib/architecture/architecture-creation-init";
import { writeArchitectureCreationDraftId, replaceArchitectureCreationUrlWithoutNavigation } from "@/lib/architecture/architecture-creation-session";
import {
  acknowledgeArchitectureDraftHandoff,
  architectureDraftSpawnedRunId,
  isArchitectureDraftHandoffAcknowledged,
  trackArchitectureDraftPostSpawnEdit,
} from "@/lib/architecture/architecture-draft-handoff-gate";
import { architectureDraftDisplayName } from "@/lib/architecture/architecture-draft-status";
import {
  buildArchitectureDraftRegistryEntry,
  upsertArchitectureDraftRegistryEntry,
} from "@/lib/architecture/architecture-draft-registry";
import {
  hasArchitectureDraftSaveableContent,
  validateArchitectureReviewReadiness,
  type ArchitectureDraftFieldState,
} from "@/lib/architecture/architecture-draft-readiness";
import { formatArchitectureReviewReadinessMessage } from "@/lib/architecture/architecture-review-readiness-copy";
import { emptyArchitectureDraftStructuredBrief } from "@/lib/architecture/architecture-draft-structured-brief";
import { architectureDraftDetailPageSubtitle } from "@/lib/architecture/architecture-draft-detail-page-copy";
import {
  ARCHITECTURES_LIST_PATH,
  isArchitectureNewDraftSegment,
  reviewDetailPath,
  startReviewFromArchitectureHref,
} from "@/lib/architecture/architecture-routes";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { getRunSummary } from "@/lib/api/architecture-runs";
import { isApiRequestError } from "@/lib/api-request-error";
import { getDraftRequest, patchDraftRequest, reopenDraftRequest } from "@/lib/api/draft-intake-api";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import { OPERATOR_QUERY_STALE_MS } from "@/lib/query/operator-query-stale-time";
import {
  ARCHITECTURE_DRAFT_INTAKE_MODE_CONTINUE_LABEL,
  architectureDraftAllowsBriefUnlock,
  isArchitectureDraftBriefFrozen,
  isArchitectureDraftInReviewIntake,
} from "@/lib/architecture/architecture-draft-intake-mode";
import {
  mergeScopeBulletsIntoBrief,
  type ScopeUnderstandingBullet,
} from "@/lib/architecture/architecture-scope-understanding-check";
import { buyerFacingReviewTitleFromSummary } from "@/lib/buyer/buyer-facing-review-title";
import { CREATE_ARCHITECTURE_INTENT } from "@/lib/architecture/architecture-workflow-intent";
import { GuidedIntakeAlreadySubmittedCallout } from "@/app/(operator)/architecture/reviews/new/GuidedIntakeAlreadySubmittedCallout";
import { GUIDED_INTAKE_ARCHITECTURE_INTENT_MIN_CHARS } from "@/lib/guided-intake-copy";
import { BUYER_START_ARCHITECTURE_REVIEW_CTA } from "@/lib/buyer/buyer-polish-copy";
import { OPERATOR_LINK, OPERATOR_PAGE_LEAD_MEASURE, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { showError, showSuccess } from "@/lib/toast";
import { cn } from "@/lib/utils";
import type { ActorSet, DraftRequestResponse } from "@/types/draft-intake";

type ArchitectureDraftWorkspaceProps = {
  readonly architectureId: string;
};

/** Long-lived architecture draft editor — save and resume without starting a review. */
export function ArchitectureDraftWorkspace(props: ArchitectureDraftWorkspaceProps): React.JSX.Element {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isNewDraft = isArchitectureNewDraftSegment(props.architectureId);
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const isDetailDraft = !isNewDraft;
  const { blocksLlmExecution } = useLlmMonthlyBudgetExecutionGate();
  const [loading, setLoading] = useState(!isNewDraft);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftRequestResponse | null>(null);
  const [fields, setFields] = useState({
    freeTextIntent: "",
    businessOutcome: "",
    systemName: "",
    structuredBrief: emptyArchitectureDraftStructuredBrief(),
  });
  const [actorSet, setActorSet] = useState<ActorSet>(() => architectureCreationDefaultActorSet());
  const [exitPending, setExitPending] = useState(false);
  const [scopeGateOpen, setScopeGateOpen] = useState(false);
  const [scopeBullets, setScopeBullets] = useState<ScopeUnderstandingBullet[]>([]);
  const [startReviewError, setStartReviewError] = useState<string | null>(null);
  const [saveActionError, setSaveActionError] = useState<string | null>(null);
  const [handoffAcknowledged, setHandoffAcknowledged] = useState(false);
  const [linkedReviewTitle, setLinkedReviewTitle] = useState("Untitled review");
  const [unlockBusy, setUnlockBusy] = useState(false);
  const [resolvedDraftId, setResolvedDraftId] = useState<string | null>(null);
  const previousSaveStateRef = useRef<ArchitectureDraftSaveState>("saved");
  const exitTimeoutIdRef = useRef<number | null>(null);
  const loadDraftInFlightRef = useRef<Promise<void> | null>(null);
  const syncDraftInFlightRef = useRef<Promise<void> | null>(null);
  const draftLifecycleRef = useRef<{
    status: DraftRequestResponse["status"] | null;
    spawnedRunId: string | null;
  }>({
    status: null,
    spawnedRunId: null,
  });
  const loadDraftRef = useRef<() => Promise<void>>(async () => undefined);
  const reviewStartProgress = useReviewStartNavigationProgress();

  const linkedReviewId = architectureDraftSpawnedRunId(draft);
  const handoffEditorLocked = linkedReviewId !== null && !handoffAcknowledged;
  const intakeModeActive = isArchitectureDraftInReviewIntake(draft?.status);
  const briefFrozen = isArchitectureDraftBriefFrozen(draft?.status);
  const canUnlockBrief = architectureDraftAllowsBriefUnlock(draft?.status);
  const editorLocked = handoffEditorLocked || briefFrozen || exitPending;
  const effectiveArchitectureId = resolvedDraftId ?? props.architectureId;

  // Reasoning needs a real draft id — unavailable on /new until the first deferred create succeeds.
  const refinementDraftId =
    draft?.draftId?.trim() || resolvedDraftId || (isNewDraft ? null : props.architectureId.trim() || null);

  const handleDraftCreated = useCallback(
    (draftId: string) => {
      writeArchitectureCreationDraftId(draftId);
      setResolvedDraftId(draftId);
      replaceArchitectureCreationUrlWithoutNavigation(draftId);
    },
    [],
  );

  const applyLoadedDraftToForm = useCallback((loaded: DraftRequestResponse) => {
    const formState = applyArchitectureCreationDraftToFormState(loaded);
    setDraft(loaded);
    setFields(formState);
    setActorSet(
      loaded.document.actorSet.actors.length > 0
        ? loaded.document.actorSet
        : architectureCreationDefaultActorSet(),
    );

    return formState;
  }, []);

  const acceptServerBaselineRef = useRef<
    (fields: ArchitectureDraftFieldState, serverUpdatedUtc: string) => void
  >(() => undefined);

  const handleDraftLoaded = useCallback(
    (loaded: DraftRequestResponse) => {
      const formState = applyLoadedDraftToForm(loaded);
      acceptServerBaselineRef.current(formState, loaded.updatedUtc);
    },
    [applyLoadedDraftToForm],
  );

  const handleImmutableDraftDetected = useCallback((loaded: DraftRequestResponse) => {
    setDraft(loaded);
  }, []);

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

  const hasUnsavedChanges = saveState === "unsaved" || saveState === "saving" || saveState === "error";
  useUnsavedChangesGuard({ when: hasUnsavedChanges && !editorLocked });

  const displayName = useMemo(
    () => architectureDraftDisplayName(fields.systemName, fields.freeTextIntent),
    [fields.freeTextIntent, fields.systemName],
  );

  const workspaceHeading = displayName;
  const workspaceLead = architectureDraftDetailPageSubtitle(buyerPolishedShell);

  const reviewReadiness = useMemo(
    () => validateArchitectureReviewReadiness(fields, actorSet.actors),
    [actorSet.actors, fields],
  );
  const needsPersistedDraftBeforeStart = isNewDraft && !hasPersistedDraft;
  const canStartReview =
    reviewReadiness.isValid &&
    scopeGateOpen &&
    !needsPersistedDraftBeforeStart &&
    saveState !== "saving" &&
    !briefFrozen &&
    saveState !== "error" &&
    saveState !== "offline" &&
    conflictMessage === null;
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

  useEffect(() => {
    setStartReviewError(null);
  }, [fields, scopeGateOpen]);

  const loadDraft = useCallback(async () => {
    if (isNewDraft) {
      return;
    }

    if (loadDraftInFlightRef.current !== null) {
      return loadDraftInFlightRef.current;
    }

    const loadPromise = (async () => {
      setLoading(true);
      setLoadError(null);

      try {
        const loaded = await queryClient.fetchQuery({
          queryKey: operatorQueryKeys.architectureDraft(props.architectureId),
          queryFn: () => getDraftRequest(props.architectureId),
          staleTime: OPERATOR_QUERY_STALE_MS,
        });

        if (loaded.document.workflowIntent !== undefined && loaded.document.workflowIntent !== CREATE_ARCHITECTURE_INTENT) {
          // Draft exists but is not a create-architecture draft — still allow editing with create intent on save.
        }

        const formState = applyLoadedDraftToForm(loaded);
        // Match autosave baseline to the hydrated form so reload does not look "unsaved"
        // and accidentally PATCH empty system name / business outcome over the server copy.
        acceptServerBaselineRef.current(formState, loaded.updatedUtc);
        setHandoffAcknowledged(isArchitectureDraftHandoffAcknowledged(props.architectureId));
        upsertArchitectureDraftRegistryEntry(
          buildArchitectureDraftRegistryEntry(loaded, {
            linkedReviewId: architectureDraftSpawnedRunId(loaded),
          }),
        );
      } catch (err) {
        if (isApiRequestError(err) && err.httpStatus === 429) {
          const waitSec = err.retryAfterSeconds;
          const waitHint =
            waitSec !== null && waitSec > 0
              ? ` Wait about ${waitSec} second${waitSec === 1 ? "" : "s"}, then retry.`
              : " Wait a short time, then retry.";

          setLoadError(`Too many requests while loading this draft.${waitHint}`);
        } else {
          setLoadError("Could not load this architecture draft.");
        }
      } finally {
        setLoading(false);
      }
    })();

    loadDraftInFlightRef.current = loadPromise;

    try {
      await loadPromise;
    } finally {
      if (loadDraftInFlightRef.current === loadPromise) {
        loadDraftInFlightRef.current = null;
      }
    }
  }, [applyLoadedDraftToForm, isNewDraft, props.architectureId, queryClient]);

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

    if (loadDraftInFlightRef.current !== null) {
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
        acceptServerBaselineRef.current(formState, loaded.updatedUtc);
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
  }, [applyLoadedDraftToForm, isNewDraft, loading, props.architectureId]);

  useEffect(() => {
    if (isNewDraft) {
      return;
    }

    void loadDraftRef.current();
  }, [isNewDraft, props.architectureId]);

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
    if (linkedReviewId === null) {
      return;
    }

    let canceled = false;

    void getRunSummary(linkedReviewId)
      .then((summary) => {
        if (!canceled) {
          setLinkedReviewTitle(buyerFacingReviewTitleFromSummary(summary));
        }
      })
      .catch(() => {
        if (!canceled) {
          setLinkedReviewTitle(linkedReviewId);
        }
      });

    return () => {
      canceled = true;
    };
  }, [linkedReviewId]);

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

  const handleSaveDraft = useCallback(async () => {
    setSaveActionError(null);
    const saved = await saveDraft();

    if (saved) {
      showSuccess("Architecture draft saved.");

      return;
    }

    // Conflict banner is driven by autosave hook state on the next render — keep failures on-page.
    setSaveActionError("Could not save your architecture draft. Try again.");
  }, [saveDraft]);

  useEffect(() => {
    return () => {
      if (exitTimeoutIdRef.current !== null) {
        window.clearTimeout(exitTimeoutIdRef.current);
        exitTimeoutIdRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (conflictMessage !== null) {
      setSaveActionError(null);
    }
  }, [conflictMessage]);

  const handleSaveAndExit = useCallback(async () => {
    if (isNewDraft && !hasPersistedDraft && !hasArchitectureDraftSaveableContent(fields)) {
      router.push(ARCHITECTURES_LIST_PATH);

      return;
    }

    setExitPending(true);
    setSaveActionError(null);

    const saved = await saveDraft();

    if (!saved) {
      setExitPending(false);
      setSaveActionError("Exit paused — save your changes before leaving this page.");

      return;
    }

    if (exitTimeoutIdRef.current !== null) {
      window.clearTimeout(exitTimeoutIdRef.current);
    }

    // Soft-nav stall must not leave Save and exit depressed forever.
    exitTimeoutIdRef.current = window.setTimeout(() => {
      setExitPending(false);
      exitTimeoutIdRef.current = null;
    }, SOFT_NAVIGATION_TIMEOUT_MS);

    router.push(ARCHITECTURES_LIST_PATH);
  }, [fields, hasPersistedDraft, isNewDraft, router, saveDraft]);

  const handleStartReview = useCallback(async () => {
    if (reviewStartProgress.isPending) {
      return;
    }

    // Client-known blockers stay on the form; CTA is disabled until canStartReview.
    if (!canStartReview) {
      return;
    }

    setStartReviewError(null);
    // Staged progress starts before the save round-trip — the whole wait is server-bound, so the
    // operator must see named stages instead of an unchanged page.
    reviewStartProgress.begin();

    try {
      const saved = await saveDraft();

      if (!saved) {
        reviewStartProgress.reset();
        setStartReviewError("Save the architecture draft before starting a review.");

        return;
      }

      reviewStartProgress.markPreparingQuestions();

      // Confirmed scope belongs on the server copy of the brief only. Mirroring it into local
      // fields would put the block in the operator's own text and feed it back to the panel.
      if (!isNewDraft) {
        const mergedIntent = mergeScopeBulletsIntoBrief(scopeBullets, fields.freeTextIntent).trim();

        if (mergedIntent.length >= GUIDED_INTAKE_ARCHITECTURE_INTENT_MIN_CHARS) {
          await patchDraftRequest(effectiveArchitectureId, {
            freeTextIntent: mergedIntent,
          });
        }
      }

      upsertArchitectureDraftRegistryEntry(
        buildArchitectureDraftRegistryEntry(draft!, {
          customerStatus: "ready-for-review",
          linkedReviewId,
        }),
      );

      reviewStartProgress.openReview(startReviewFromArchitectureHref(effectiveArchitectureId));
    } catch {
      reviewStartProgress.reset();
      setStartReviewError("Could not start the architecture review. Try again.");
    }
  }, [
    canStartReview,
    draft,
    effectiveArchitectureId,
    fields.freeTextIntent,
    isNewDraft,
    linkedReviewId,
    reviewStartProgress,
    saveDraft,
    scopeBullets,
  ]);

  const handleAcknowledgeHandoff = useCallback(() => {
    if (linkedReviewId === null) {
      return;
    }

    acknowledgeArchitectureDraftHandoff(effectiveArchitectureId, linkedReviewId);
    setHandoffAcknowledged(true);
  }, [effectiveArchitectureId, linkedReviewId]);

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

      <Card>
        <CardContent className="space-y-6 pt-6">
          <ArchitectureDraftFormFields
            fields={fields}
            actorSet={actorSet}
            disabled={editorLocked}
            blocksLlmExecution={blocksLlmExecution}
            markReviewReadinessInvalid={linkedReviewId === null && !reviewReadiness.isValid}
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
        {linkedReviewId === null && !briefFrozen && !reviewReadiness.isValid ? (
          <p
            className={cn("m-0", OPERATOR_TYPOGRAPHY.helper, "text-red-800 dark:text-red-300")}
            role="alert"
            data-testid="architecture-draft-review-readiness"
          >
            {formatArchitectureReviewReadinessMessage(reviewReadiness.blockers)}
          </p>
        ) : null}
        {linkedReviewId === null && !briefFrozen && reviewReadiness.isValid && !needsPersistedDraftBeforeStart && !scopeGateOpen ? (
          <p
            className={cn("m-0", OPERATOR_TYPOGRAPHY.helper, "text-al-text-secondary")}
            role="status"
            data-testid="architecture-draft-scope-readiness"
          >
            Confirm the in-scope understanding before starting a review.
          </p>
        ) : null}
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
        {startReviewError !== null ? (
          <OperatorMutationInlineError
            message={startReviewError}
            testId="architecture-start-review-error"
            recoveryScenario="api-problem"
          />
        ) : null}
        {saveActionError !== null && conflictMessage === null ? (
          <OperatorMutationInlineError
            message={saveActionError}
            testId="architecture-draft-save-action-error"
            recoveryScenario="api-problem"
          />
        ) : null}
        <div className="flex flex-wrap gap-2">
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
          {saveState === "error" || saveState === "offline" ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={editorLocked}
              onClick={() => {
                void handleSaveDraft();
              }}
              data-testid="architecture-save-draft-retry"
            >
              Save now
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={editorLocked || saveState === "saving"}
            onClick={() => {
              void handleSaveAndExit();
            }}
            data-testid="architecture-save-and-exit"
          >
            Save and exit
          </Button>
        </div>
      </div>
    </div>
  );
}
