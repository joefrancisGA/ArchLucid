"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ArchitectureCreationLocalDraftsPanel } from "@/components/architecture/ArchitectureCreationLocalDraftsPanel";
import { ArchitectureDraftAiRefinePanel } from "@/components/architecture/ArchitectureDraftAiRefinePanel";
import { ArchitectureDraftFormFields } from "@/components/architecture/ArchitectureDraftFormFields";
import { ArchitectureDraftGuidanceDisclosure } from "@/components/architecture/ArchitectureDraftGuidanceDisclosure";
import { ArchitectureDraftHandoffBanner } from "@/components/architecture/ArchitectureDraftHandoffBanner";
import { ArchitectureScopeUnderstandingCheckPanel } from "@/components/architecture/ArchitectureScopeUnderstandingCheckPanel";
import { ArchitectureDraftWorkspaceLoadingSkeleton } from "@/components/architecture/ArchitectureDraftWorkspaceLoadingSkeleton";
import { ArchitectureDraftSaveStatus } from "@/components/architecture/ArchitectureDraftSaveStatus";
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
import { StatusTag } from "@/components/ui/status-tag";
import { useArchitectureDraftRegistryEntries } from "@/hooks/use-architecture-draft-registry-entries";
import { useArchitectureDraftAutosave, type ArchitectureDraftSaveState } from "@/hooks/use-architecture-draft-autosave";
import { useLlmMonthlyBudgetExecutionGate } from "@/hooks/use-llm-monthly-budget-execution-gate";
import { useReviewStartNavigationProgress } from "@/hooks/use-review-start-navigation-progress";
import { SOFT_NAVIGATION_TIMEOUT_MS } from "@/hooks/use-soft-navigation-loading";
import { useUnsavedChangesGuard } from "@/hooks/use-unsaved-changes-guard";
import {
  applyArchitectureCreationDraftToFormState,
  architectureCreationDefaultActorSet,
} from "@/lib/architecture/architecture-creation-init";
import { writeArchitectureCreationDraftId } from "@/lib/architecture/architecture-creation-session";
import {
  acknowledgeArchitectureDraftHandoff,
  architectureDraftSpawnedRunId,
  isArchitectureDraftHandoffAcknowledged,
  trackArchitectureDraftPostSpawnEdit,
} from "@/lib/architecture/architecture-draft-handoff-gate";
import {
  ARCHITECTURE_DRAFT_STATUS_LABELS,
  architectureDraftCustomerStatusTagKind,
  architectureDraftDisplayName,
  resolveArchitectureDraftCustomerStatus,
} from "@/lib/architecture/architecture-draft-status";
import {
  buildArchitectureDraftRegistryEntry,
  upsertArchitectureDraftRegistryEntry,
} from "@/lib/architecture/architecture-draft-registry";
import {
  hasArchitectureDraftSaveableContent,
  validateArchitectureReviewReadiness,
  type ArchitectureDraftFieldState,
} from "@/lib/architecture/architecture-draft-readiness";
import { emptyArchitectureDraftStructuredBrief } from "@/lib/architecture/architecture-draft-structured-brief";
import {
  ARCHITECTURES_LIST_PATH,
  architectureDraftPath,
  isArchitectureNewDraftSegment,
  reviewDetailPath,
  startReviewFromArchitectureHref,
} from "@/lib/architecture/architecture-routes";
import { getRunSummary } from "@/lib/api/architecture-runs";
import { getDraftRequest, patchDraftRequest } from "@/lib/api/draft-intake-api";
import {
  mergeScopeBulletsIntoBrief,
  type ScopeUnderstandingBullet,
} from "@/lib/architecture/architecture-scope-understanding-check";
import { buyerFacingReviewTitleFromSummary } from "@/lib/buyer/buyer-facing-review-title";
import { CREATE_ARCHITECTURE_INTENT } from "@/lib/architecture/architecture-workflow-intent";
import { BUYER_START_ARCHITECTURE_REVIEW_CTA } from "@/lib/buyer/buyer-polish-copy";
import {
  ARCHITECTURE_CREATION_NEW_DRAFT_SECTION_TITLE,
  ARCHITECTURE_CREATION_RESUME_FIRST_WORKSPACE_LEAD,
  ARCHITECTURE_DRAFT_WORKSPACE_LEAD,
} from "@/lib/create-vs-review-intake-copy";
import { OPERATOR_PAGE_LEAD_MEASURE, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { showSuccess } from "@/lib/toast";
import { cn } from "@/lib/utils";
import type { ActorSet, DraftRequestResponse } from "@/types/draft-intake";

type ArchitectureDraftWorkspaceProps = {
  readonly architectureId: string;
};

/** Long-lived architecture draft editor — save and resume without starting a review. */
export function ArchitectureDraftWorkspace(props: ArchitectureDraftWorkspaceProps): React.JSX.Element {
  const router = useRouter();
  const isNewDraft = isArchitectureNewDraftSegment(props.architectureId);
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
  const [registryHydrated, setRegistryHydrated] = useState(false);
  const previousSaveStateRef = useRef<ArchitectureDraftSaveState>("saved");
  const exitTimeoutIdRef = useRef<number | null>(null);
  const reviewStartProgress = useReviewStartNavigationProgress();

  const linkedReviewId = architectureDraftSpawnedRunId(draft);
  const handoffEditorLocked = linkedReviewId !== null && !handoffAcknowledged;
  const localDraftRegistryEntries = useArchitectureDraftRegistryEntries();

  useEffect(() => {
    setRegistryHydrated(true);
  }, []);

  const hasLocalDraftsOnCreatePath =
    isNewDraft && registryHydrated && localDraftRegistryEntries.length > 0;
  // Reasoning needs a real draft id — unavailable on /new until the first deferred create succeeds.
  const refinementDraftId = draft?.draftId?.trim() || (isNewDraft ? null : props.architectureId.trim() || null);

  const handleDraftCreated = useCallback(
    (draftId: string) => {
      writeArchitectureCreationDraftId(draftId);
      router.replace(architectureDraftPath(draftId));
    },
    [router],
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

  const { saveState, lastSavedUtc, conflictMessage, saveDraft, reloadDraft, acceptServerBaseline, hasPersistedDraft } =
    useArchitectureDraftAutosave({
      architectureId: props.architectureId,
      fields,
      actorSet,
      enabled: !handoffEditorLocked,
      deferCreateUntilFirstSave: isNewDraft,
      onDraftCreated: isNewDraft ? handleDraftCreated : undefined,
      onDraftLoaded: handleDraftLoaded,
    });

  acceptServerBaselineRef.current = acceptServerBaseline;

  const hasUnsavedChanges = saveState === "unsaved" || saveState === "saving" || saveState === "error";
  useUnsavedChangesGuard({ when: hasUnsavedChanges && !handoffEditorLocked });

  const displayName = useMemo(
    () => architectureDraftDisplayName(fields.systemName, fields.freeTextIntent),
    [fields.freeTextIntent, fields.systemName],
  );

  const workspaceHeading = isNewDraft ? ARCHITECTURE_CREATION_NEW_DRAFT_SECTION_TITLE : displayName;
  const WorkspaceHeadingTag = isNewDraft ? "h2" : "h1";

  const workspaceLead = hasLocalDraftsOnCreatePath
    ? ARCHITECTURE_CREATION_RESUME_FIRST_WORKSPACE_LEAD
    : ARCHITECTURE_DRAFT_WORKSPACE_LEAD;

  const reviewReadiness = useMemo(
    () => validateArchitectureReviewReadiness(fields, actorSet.actors),
    [actorSet.actors, fields],
  );
  const needsPersistedDraftBeforeStart = isNewDraft && !hasPersistedDraft;
  const canStartReview =
    reviewReadiness.isValid && scopeGateOpen && !needsPersistedDraftBeforeStart && saveState !== "saving";
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

  const customerStatus = useMemo(
    () =>
      resolveArchitectureDraftCustomerStatus({
        linkedReviewId,
        reviewReadinessValid: reviewReadiness.isValid,
      }),
    [linkedReviewId, reviewReadiness.isValid],
  );

  useEffect(() => {
    setStartReviewError(null);
  }, [fields, scopeGateOpen]);

  const loadDraft = useCallback(async () => {
    if (isNewDraft) {
      return;
    }

    setLoading(true);
    setLoadError(null);

    try {
      const loaded = await getDraftRequest(props.architectureId);

      if (loaded.document.workflowIntent !== undefined && loaded.document.workflowIntent !== CREATE_ARCHITECTURE_INTENT) {
        // Draft exists but is not a create-architecture draft — still allow editing with create intent on save.
      }

      const formState = applyLoadedDraftToForm(loaded);
      // Match autosave baseline to the hydrated form so reload does not look "unsaved"
      // and accidentally PATCH empty system name / business outcome over the server copy.
      acceptServerBaseline(formState, loaded.updatedUtc);
      setHandoffAcknowledged(isArchitectureDraftHandoffAcknowledged(props.architectureId));
      upsertArchitectureDraftRegistryEntry(
        buildArchitectureDraftRegistryEntry(loaded, {
          linkedReviewId: architectureDraftSpawnedRunId(loaded),
        }),
      );
    } catch {
      setLoadError("Could not load this architecture draft.");
    } finally {
      setLoading(false);
    }
  }, [acceptServerBaseline, applyLoadedDraftToForm, isNewDraft, props.architectureId]);

  useEffect(() => {
    if (isNewDraft) {
      return;
    }

    void loadDraft();
  }, [isNewDraft, loadDraft]);

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
      trackArchitectureDraftPostSpawnEdit(props.architectureId, linkedReviewId);
    }

    previousSaveStateRef.current = saveState;
  }, [handoffAcknowledged, linkedReviewId, props.architectureId, saveState]);

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
        await patchDraftRequest(props.architectureId, {
          freeTextIntent: mergeScopeBulletsIntoBrief(scopeBullets, fields.freeTextIntent),
        });
      }

      upsertArchitectureDraftRegistryEntry(
        buildArchitectureDraftRegistryEntry(draft!, {
          customerStatus: "ready-for-review",
          linkedReviewId,
        }),
      );

      reviewStartProgress.openReview(startReviewFromArchitectureHref(props.architectureId));
    } catch {
      reviewStartProgress.reset();
      setStartReviewError("Could not start the architecture review. Try again.");
    }
  }, [
    canStartReview,
    draft,
    fields.freeTextIntent,
    isNewDraft,
    linkedReviewId,
    props.architectureId,
    reviewStartProgress,
    saveDraft,
    scopeBullets,
  ]);

  const handleAcknowledgeHandoff = useCallback(() => {
    if (linkedReviewId === null) {
      return;
    }

    acknowledgeArchitectureDraftHandoff(props.architectureId, linkedReviewId);
    setHandoffAcknowledged(true);
  }, [linkedReviewId, props.architectureId]);

  if (loading) {
    return (
      <div className="space-y-3" data-testid="architecture-draft-workspace-loading">
        <ArchitectureDraftWorkspaceLoadingSkeleton />
      </div>
    );
  }

  if (loadError !== null) {
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
      {isNewDraft ? <ArchitectureCreationLocalDraftsPanel /> : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <WorkspaceHeadingTag
            className={cn("m-0", OPERATOR_TYPOGRAPHY.pageTitle)}
            data-testid={
              isNewDraft ? "architecture-creation-new-draft-section-title" : "architecture-draft-workspace-title"
            }
          >
            {workspaceHeading}
          </WorkspaceHeadingTag>
          <p className={cn("m-0", OPERATOR_PAGE_LEAD_MEASURE, OPERATOR_TYPOGRAPHY.helper)} data-testid="architecture-draft-workspace-lead">
            {workspaceLead}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <StatusTag
              kind={architectureDraftCustomerStatusTagKind(customerStatus)}
              label={ARCHITECTURE_DRAFT_STATUS_LABELS[customerStatus]}
              data-testid="architecture-draft-workspace-status-tag"
            />
            {linkedReviewId !== null ? (
              <Link
                href={reviewDetailPath(linkedReviewId)}
                className={cn(OPERATOR_TYPOGRAPHY.helper, "font-medium text-teal-800 underline dark:text-teal-300")}
              >
                Open linked review
              </Link>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
          {isNewDraft ? null : <PageContextualHelpButton />}
          <ArchitectureDraftSaveStatus
            saveState={saveState}
            lastSavedUtc={lastSavedUtc}
            autosaveActive={!handoffEditorLocked}
            hasPersistedDraft={hasPersistedDraft}
          />
        </div>
      </div>

      {linkedReviewId !== null ? (
        <ArchitectureDraftHandoffBanner
          linkedReviewId={linkedReviewId}
          linkedReviewTitle={linkedReviewTitle}
          editorLocked={handoffEditorLocked}
          onAcknowledgeEditAnyway={handleAcknowledgeHandoff}
        />
      ) : null}

      <ArchitectureDraftGuidanceDisclosure />

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
            disabled={handoffEditorLocked || exitPending}
            markReviewReadinessInvalid={linkedReviewId === null && !reviewReadiness.isValid}
            onFieldsChange={setFields}
            onActorSetChange={setActorSet}
          />
        </CardContent>
      </Card>

      {refinementDraftId !== null && !handoffEditorLocked ? (
        <DraftIntakeAdvancedSection defaultOpen={false}>
          <AiBudgetSpendNotice
            action="Architecture reasoning"
            testId="architecture-draft-ai-budget-notice"
          />
          <ArchitectureDraftAiRefinePanel
            fields={fields}
            linkedReviewId={linkedReviewId}
            disabled={exitPending || blocksLlmExecution}
          />
          <DraftIntakeReasoningPanel
            draftId={refinementDraftId}
            disabled={exitPending || blocksLlmExecution}
            embedded
          />
        </DraftIntakeAdvancedSection>
      ) : null}

      {linkedReviewId === null ? (
        <ArchitectureScopeUnderstandingCheckPanel
          input={scopeUnderstandingInput}
          disabled={handoffEditorLocked || exitPending || reviewStartProgress.isPending}
          onBulletsChange={setScopeBullets}
          onGateChange={setScopeGateOpen}
        />
      ) : null}

      {linkedReviewId === null ? (
        <PreExecuteCostEstimateNotice testId="architecture-draft-pre-execute-cost" />
      ) : null}

      <div className="space-y-2">
        {linkedReviewId === null && !reviewReadiness.isValid ? (
          <p
            className={cn("m-0", OPERATOR_TYPOGRAPHY.helper, "text-red-800 dark:text-red-300")}
            role="alert"
            data-testid="architecture-draft-review-readiness"
          >
            Add {reviewReadiness.blockers.join(" and ")} before starting a review.
          </p>
        ) : null}
        {linkedReviewId === null && reviewReadiness.isValid && needsPersistedDraftBeforeStart ? (
          <p
            className={cn("m-0", OPERATOR_TYPOGRAPHY.helper, "text-al-text-secondary")}
            role="status"
            data-testid="architecture-draft-persist-readiness"
          >
            Save the architecture draft before starting a review.
          </p>
        ) : null}
        {linkedReviewId === null && reviewReadiness.isValid && !needsPersistedDraftBeforeStart && !scopeGateOpen ? (
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
            href={startReviewFromArchitectureHref(props.architectureId)}
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
          {linkedReviewId !== null ? (
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
              disabled={handoffEditorLocked}
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
            disabled={handoffEditorLocked || saveState === "saving" || exitPending}
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
