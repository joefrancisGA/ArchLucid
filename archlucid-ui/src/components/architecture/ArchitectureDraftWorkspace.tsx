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
import { ArchitectureDraftWorkspaceListWayfinding } from "@/components/architecture/ArchitectureDraftWorkspaceListWayfinding";
import { ArchitectureDraftWorkspaceLoadingSkeleton } from "@/components/architecture/ArchitectureDraftWorkspaceLoadingSkeleton";
import { ArchitectureDraftSaveStatus } from "@/components/architecture/ArchitectureDraftSaveStatus";
import { AiBudgetSpendNotice } from "@/components/ai-budget/AiBudgetSpendNotice";
import { DraftIntakeAdvancedSection } from "@/components/draft-intake/DraftIntakeAdvancedSection";
import { DraftIntakeReasoningPanel } from "@/components/draft-intake/DraftIntakeReasoningPanel";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { ReplayCostPreExecuteCostVocabularyRail } from "@/components/ReplayCostPreExecuteCostVocabularyRail";
import { PreExecuteCostEstimateNotice } from "@/components/usability/PreExecuteCostEstimateNotice";
import { Button } from "@/components/ui/button";
import { ReviewStartLoadingButton } from "@/components/review-intake/ReviewStartLoadingButton";
import { Card, CardContent } from "@/components/ui/card";
import { StatusTag } from "@/components/ui/status-tag";
import { useArchitectureDraftRegistryEntries } from "@/hooks/use-architecture-draft-registry-entries";
import { useArchitectureDraftAutosave, type ArchitectureDraftSaveState } from "@/hooks/use-architecture-draft-autosave";
import { useLlmMonthlyBudgetExecutionGate } from "@/hooks/use-llm-monthly-budget-execution-gate";
import { SOFT_NAVIGATION_TIMEOUT_MS } from "@/hooks/use-soft-navigation-loading";
import { useUnsavedChangesGuard } from "@/hooks/use-unsaved-changes-guard";
import {
  applyArchitectureCreationDraftToFormState,
  architectureCreationDefaultActorSet,
} from "@/lib/architecture-creation-init";
import { writeArchitectureCreationDraftId } from "@/lib/architecture-creation-session";
import {
  acknowledgeArchitectureDraftHandoff,
  architectureDraftSpawnedRunId,
  isArchitectureDraftHandoffAcknowledged,
  trackArchitectureDraftPostSpawnEdit,
} from "@/lib/architecture-draft-handoff-gate";
import {
  ARCHITECTURE_DRAFT_STATUS_LABELS,
  architectureDraftCustomerStatusTagKind,
  architectureDraftDisplayName,
  resolveArchitectureDraftCustomerStatus,
} from "@/lib/architecture-draft-status";
import {
  buildArchitectureDraftRegistryEntry,
  upsertArchitectureDraftRegistryEntry,
} from "@/lib/architecture-draft-registry";
import {
  hasArchitectureDraftSaveableContent,
  validateArchitectureReviewReadiness,
} from "@/lib/architecture-draft-readiness";
import {
  ARCHITECTURES_LIST_PATH,
  architectureDraftPath,
  isArchitectureNewDraftSegment,
  reviewDetailPath,
  startReviewFromArchitectureHref,
} from "@/lib/architecture-routes";
import { getRunSummary } from "@/lib/api/architecture-runs";
import { getDraftRequest, patchDraftRequest } from "@/lib/api/draft-intake-api";
import {
  mergeScopeBulletsIntoBrief,
  type ScopeUnderstandingBullet,
} from "@/lib/architecture-scope-understanding-check";
import { buyerFacingReviewTitleFromSummary } from "@/lib/buyer-facing-review-title";
import { CREATE_ARCHITECTURE_INTENT } from "@/lib/architecture-workflow-intent";
import { BUYER_START_ARCHITECTURE_REVIEW_CTA } from "@/lib/buyer-polish-copy";
import { REVIEW_START_PREPARING_LABEL } from "@/lib/review-start-progress-copy";
import {
  ARCHITECTURE_CREATION_NEW_DRAFT_SECTION_TITLE,
  ARCHITECTURE_CREATION_RESUME_FIRST_WORKSPACE_LEAD,
  ARCHITECTURE_DRAFT_WORKSPACE_LEAD,
} from "@/lib/create-vs-review-intake-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { showError, showSuccess } from "@/lib/toast";
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
  });
  const [actorSet, setActorSet] = useState<ActorSet>(() => architectureCreationDefaultActorSet());
  const [exitPending, setExitPending] = useState(false);
  const [startReviewPending, setStartReviewPending] = useState(false);
  const [scopeGateOpen, setScopeGateOpen] = useState(false);
  const [scopeBullets, setScopeBullets] = useState<ScopeUnderstandingBullet[]>([]);
  const [handoffAcknowledged, setHandoffAcknowledged] = useState(false);
  const [linkedReviewTitle, setLinkedReviewTitle] = useState("Untitled review");
  const [registryHydrated, setRegistryHydrated] = useState(false);
  const previousSaveStateRef = useRef<ArchitectureDraftSaveState>("saved");
  const exitTimeoutIdRef = useRef<number | null>(null);
  const startReviewTimeoutIdRef = useRef<number | null>(null);

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
    (fields: { freeTextIntent: string; businessOutcome: string; systemName: string }, serverUpdatedUtc: string) => void
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

  const reviewReadiness = useMemo(() => validateArchitectureReviewReadiness(fields), [fields]);
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

    let cancelled = false;

    void getRunSummary(linkedReviewId)
      .then((summary) => {
        if (!cancelled) {
          setLinkedReviewTitle(buyerFacingReviewTitleFromSummary(summary));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLinkedReviewTitle(linkedReviewId);
        }
      });

    return () => {
      cancelled = true;
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
    const saved = await saveDraft();

    if (saved) {
      showSuccess("Architecture draft saved.");
    } else if (conflictMessage !== null) {
      showError("Architecture draft", conflictMessage);
    } else {
      showError("Architecture draft", "Could not save your architecture draft. Try again.");
    }
  }, [conflictMessage, saveDraft]);

  useEffect(() => {
    return () => {
      if (exitTimeoutIdRef.current !== null) {
        window.clearTimeout(exitTimeoutIdRef.current);
        exitTimeoutIdRef.current = null;
      }
    };
  }, []);

  const handleSaveAndExit = useCallback(async () => {
    if (isNewDraft && !hasPersistedDraft && !hasArchitectureDraftSaveableContent(fields)) {
      router.push(ARCHITECTURES_LIST_PATH);

      return;
    }

    setExitPending(true);

    const saved = await saveDraft();

    if (!saved) {
      setExitPending(false);
      showError("Architecture draft", "Exit paused — save your changes before leaving this page.");

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
    if (startReviewPending) {
      return;
    }

    if (isNewDraft && !hasPersistedDraft) {
      showError("Start architecture review", "Save the architecture draft before starting a review.");

      return;
    }

    if (!reviewReadiness.isValid) {
      showError(
        "Start architecture review",
        `Add ${reviewReadiness.blockers.join(" and ")} before starting a review.`,
      );

      return;
    }

    if (!scopeGateOpen) {
      showError("Start architecture review", "Confirm or accept the inferred scope before starting a review.");

      return;
    }

    if (startReviewTimeoutIdRef.current !== null) {
      window.clearTimeout(startReviewTimeoutIdRef.current);
    }

    setStartReviewPending(true);

    // Soft-nav stall must not leave Start review depressed forever.
    startReviewTimeoutIdRef.current = window.setTimeout(() => {
      setStartReviewPending(false);
      startReviewTimeoutIdRef.current = null;
    }, SOFT_NAVIGATION_TIMEOUT_MS);

    try {
      if (!isNewDraft) {
        const briefWithScope = mergeScopeBulletsIntoBrief(scopeBullets, fields.businessOutcome);
        await patchDraftRequest(props.architectureId, { businessOutcome: briefWithScope });
        setFields((current) => ({ ...current, businessOutcome: briefWithScope }));
      }

      const saved = await saveDraft();

      if (!saved) {
        if (startReviewTimeoutIdRef.current !== null) {
          window.clearTimeout(startReviewTimeoutIdRef.current);
          startReviewTimeoutIdRef.current = null;
        }

        setStartReviewPending(false);
        showError("Start architecture review", "Save the architecture draft before starting a review.");

        return;
      }

      upsertArchitectureDraftRegistryEntry(
        buildArchitectureDraftRegistryEntry(draft!, {
          customerStatus: "ready-for-review",
          linkedReviewId,
        }),
      );

      router.push(startReviewFromArchitectureHref(props.architectureId));
    } catch {
      if (startReviewTimeoutIdRef.current !== null) {
        window.clearTimeout(startReviewTimeoutIdRef.current);
        startReviewTimeoutIdRef.current = null;
      }

      setStartReviewPending(false);
      showError("Start architecture review", "Could not start the architecture review. Try again.");
    }
  }, [
    draft,
    hasPersistedDraft,
    isNewDraft,
    linkedReviewId,
    props.architectureId,
    reviewReadiness,
    router,
    saveDraft,
    scopeBullets,
    scopeGateOpen,
    fields.businessOutcome,
    isNewDraft,
    startReviewPending,
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
        {isNewDraft ? null : <ArchitectureDraftWorkspaceListWayfinding />}
        <ArchitectureDraftWorkspaceLoadingSkeleton />
      </div>
    );
  }

  if (loadError !== null) {
    return (
      <div className="space-y-3" data-testid="architecture-draft-workspace-error">
        {isNewDraft ? null : <ArchitectureDraftWorkspaceListWayfinding />}
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
      {isNewDraft ? null : <ArchitectureDraftWorkspaceListWayfinding />}
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
          <p className={cn("m-0 max-w-prose", OPERATOR_TYPOGRAPHY.helper)} data-testid="architecture-draft-workspace-lead">
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
        <ArchitectureDraftSaveStatus
          saveState={saveState}
          lastSavedUtc={lastSavedUtc}
          autosaveActive={!handoffEditorLocked}
          hasPersistedDraft={hasPersistedDraft}
        />
      </div>

      {linkedReviewId !== null ? (
        <ArchitectureDraftHandoffBanner
          linkedReviewId={linkedReviewId}
          linkedReviewTitle={linkedReviewTitle}
          editorLocked={handoffEditorLocked}
          onAcknowledgeEditAnyway={handleAcknowledgeHandoff}
        />
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <ArchitectureDraftGuidanceDisclosure className="flex-1" />
        {isNewDraft ? null : <PageContextualHelpButton />}
      </div>

      {conflictMessage !== null ? (
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)} role="alert" data-testid="architecture-draft-conflict">
          {conflictMessage}{" "}
          <button
            type="button"
            className="font-medium text-teal-800 underline dark:text-teal-300"
            onClick={() => {
              void reloadDraft();
            }}
          >
            Refresh draft
          </button>
        </p>
      ) : null}

      <Card>
        <CardContent className="space-y-6 pt-6">
          <ArchitectureDraftFormFields
            fields={fields}
            actorSet={actorSet}
            disabled={handoffEditorLocked || exitPending}
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
          disabled={handoffEditorLocked || exitPending || startReviewPending}
          onBulletsChange={setScopeBullets}
          onGateChange={setScopeGateOpen}
        />
      ) : null}

      {linkedReviewId === null ? (
        <>
          <ReplayCostPreExecuteCostVocabularyRail currentSurfaceId="pre-execute-cost" />
          <PreExecuteCostEstimateNotice testId="architecture-draft-pre-execute-cost" />
        </>
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
            disabled={saveState === "saving" || (isNewDraft && !hasPersistedDraft) || !scopeGateOpen}
            isLoading={startReviewPending}
            idleLabel={BUYER_START_ARCHITECTURE_REVIEW_CTA}
            loadingLabel={REVIEW_START_PREPARING_LABEL}
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

      {!reviewReadiness.isValid && linkedReviewId === null ? (
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper, "text-al-text-secondary")}>
          Review readiness: add {reviewReadiness.blockers.join(" and ")} before starting a review.
        </p>
      ) : null}
    </div>
  );
}
