"use client";

import { type Dispatch, type SetStateAction } from "react";
import dynamic from "next/dynamic";

import { ArchitectureDraftHandoffPanel } from "@/components/architecture/ArchitectureDraftHandoffPanel";
import { ArchitectureDraftDetailLoadFailure } from "@/components/architecture/ArchitectureDraftDetailLoadFailure";
import { ArchitectureDraftWorkspaceHeaderChrome } from "@/components/architecture/ArchitectureDraftWorkspaceHeaderChrome";
import { OperatorErrorRecoveryContract } from "@/components/usability/OperatorErrorRecoveryContract";
import { ARCHITECTURES_LIST_PATH } from "@/lib/architecture/architecture-routes";
import { errorRecoveryContractForScenario } from "@/lib/error-recovery-contract-copy";
import { OPERATOR_LINK } from "@/lib/design-tokens";
import Link from "next/link";
import { ArchitectureDraftFormFields } from "@/components/architecture/ArchitectureDraftFormFields";
import { ArchitectureDraftNextDraftFooter } from "@/components/architecture/ArchitectureDraftNextDraftFooter";
import { ArchitectureDraftStartReviewGate } from "@/components/architecture/ArchitectureDraftStartReviewGate";
import { DraftInvariantEnvelopePreview } from "@/components/architecture/DraftInvariantEnvelopePreview";
import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { ArchitectureDraftWorkspaceIntakeStack } from "@/components/architecture/ArchitectureDraftWorkspaceIntakeStack";
import { ArchitectureDraftWorkspaceLoadingSkeleton } from "@/components/architecture/ArchitectureDraftWorkspaceLoadingSkeleton";
import { ArchitectureDraftWorkspaceStartReviewFooter } from "@/components/architecture/ArchitectureDraftWorkspaceStartReviewFooter";
import { ArchitectureScopeUnderstandingCheckPanel } from "@/components/architecture/ArchitectureScopeUnderstandingCheckPanel";
import { AiBudgetSpendNotice } from "@/components/ai-budget/AiBudgetSpendNotice";
import { IntegrationConnectChecklist } from "@/components/integrations/IntegrationConnectChecklist";
import { ReviewStartStagedProgress } from "@/components/review-intake/ReviewStartStagedProgress";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ArchitectureDraftSaveState } from "@/hooks/use-architecture-draft-autosave";
import type { ArchitectureDraftFieldState } from "@/lib/architecture/architecture-draft-readiness";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { ReviewStartStageId } from "@/lib/review-start-progress-stages";
import { cn } from "@/lib/utils";
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
  readonly unlockError: string | null;
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
  readonly persistedScopeFingerprint: string | null;
  readonly persistScopeConfirmation: Parameters<
    typeof ArchitectureScopeUnderstandingCheckPanel
  >[0]["onConfirm"];
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
    onLoadDraft: loadDraft,
    fields,
    actorSet,
    editorLocked,
    handoffEditorLocked,
    blocksLlmExecution,
    architectureId,
    workspaceHeading,
    effectiveArchitectureId,
    linkedReviewId,
    linkedReviewTitle,
    reviewReadiness,
    setActorSuggestionsUnresolved,
    actorSuggestionGateRequestId,
    setFields,
    setActorSet,
    refinementDraftId,
    exitPending,
  } = props;

  const { isWorkingMode } = useWorkspaceMode();

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

    const presentation = errorRecoveryContractForScenario("architecture-draft-load", {
      failureSummary: loadError,
    });

    return (
      <div className="space-y-3" data-testid="architecture-draft-workspace-error">
        <OperatorErrorRecoveryContract
          testId="architecture-draft-workspace-load-recovery"
          presentation={presentation}
        />
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => void loadDraft()}>
            Retry
          </Button>
          <Link href={ARCHITECTURES_LIST_PATH} className={OPERATOR_LINK.nav}>
            Back to architectures list
          </Link>
        </div>
      </div>
    );
  }

  if (isWorkingMode && handoffEditorLocked && linkedReviewId !== null) {
    return (
      <div className="space-y-4" data-testid="architecture-draft-workspace">
        <ArchitectureDraftWorkspaceHeaderChrome {...props} />
        <ArchitectureDraftHandoffPanel
          architectureId={architectureId}
          workspaceHeading={workspaceHeading}
          linkedReviewId={linkedReviewId}
          linkedReviewTitle={linkedReviewTitle}
          fields={fields}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="architecture-draft-workspace">
      <ArchitectureDraftWorkspaceHeaderChrome {...props} />
      <ArchitectureDraftWorkspaceIntakeStack {...props} />

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

      {isWorkingMode && !handoffEditorLocked ? (
        <DraftInvariantEnvelopePreview
          baselineOutcome={fields.businessOutcome}
          baselineIntent={fields.freeTextIntent}
        />
      ) : null}

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

      <ArchitectureDraftWorkspaceStartReviewFooter {...props} />
    </div>
  );
}
