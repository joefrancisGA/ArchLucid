"use client";

import { ArchitectureCreationLocalDraftsPanel } from "@/components/architecture/ArchitectureCreationLocalDraftsPanel";
import { ArchitectureDraftDetailBuyerChrome } from "@/app/(operator)/architecture/architectures/_sections/ArchitectureDraftDetailBuyerChrome";
import { ArchitectureDraftGuidanceDisclosure } from "@/components/architecture/ArchitectureDraftGuidanceDisclosure";
import { ArchitectureDraftHandoffBanner } from "@/components/architecture/ArchitectureDraftHandoffBanner";
import { ArchitectureDraftIntakeModeBanner } from "@/components/architecture/ArchitectureDraftIntakeModeBanner";
import { IntegrationConnectChecklist } from "@/components/integrations/IntegrationConnectChecklist";
import { OperatorMutationInlineError } from "@/components/operator/OperatorMutationInlineError";
import { Button } from "@/components/ui/button";
import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { GuidedIntakeAlreadySubmittedCallout } from "@/app/(operator)/architecture/reviews/new/GuidedIntakeAlreadySubmittedCallout";
import {
  ARCHITECTURE_DRAFT_START_REVIEW_CHECKLIST_TITLE,
} from "@/lib/architecture-draft-start-review-checklist";
import { startReviewFromArchitectureHref } from "@/lib/architecture/architecture-routes";
import type { ArchitectureDraftWorkspaceBodyProps } from "./ArchitectureDraftWorkspaceBody";

type ArchitectureDraftWorkspaceIntakeStackProps = Pick<
  ArchitectureDraftWorkspaceBodyProps,
  | "buyerPolishedShell"
  | "isNewDraft"
  | "isDetailDraft"
  | "linkedReviewId"
  | "linkedReviewTitle"
  | "intakeModeActive"
  | "draft"
  | "effectiveDraftId"
  | "canUnlockBrief"
  | "unlockBusy"
  | "onUnlockBrief"
  | "conflictMessage"
  | "onReloadDraft"
  | "onKeepLocalDraft"
  | "draftStartReviewChecklistDescription"
  | "draftStartReviewSteps"
  | "draftStartReviewEmphasizedStepId"
>;

export function ArchitectureDraftWorkspaceIntakeStack(
  props: ArchitectureDraftWorkspaceIntakeStackProps,
): React.JSX.Element {
  const {
    buyerPolishedShell,
    isNewDraft,
    isDetailDraft,
    linkedReviewId,
    linkedReviewTitle,
    intakeModeActive,
    draft,
    effectiveDraftId,
    canUnlockBrief,
    unlockBusy,
    onUnlockBrief,
    conflictMessage,
    onReloadDraft,
    onKeepLocalDraft,
    draftStartReviewChecklistDescription,
    draftStartReviewSteps,
    draftStartReviewEmphasizedStepId,
  } = props;
  const { isWorkingMode } = useWorkspaceMode();

  return (
    <>
      {buyerPolishedShell ? null : <ArchitectureDraftGuidanceDisclosure />}

      {isNewDraft ? <ArchitectureCreationLocalDraftsPanel /> : null}

      {isDetailDraft && buyerPolishedShell ? <ArchitectureDraftDetailBuyerChrome /> : null}

      {linkedReviewId !== null ? (
        <ArchitectureDraftHandoffBanner
          draftId={effectiveDraftId}
          linkedReviewId={linkedReviewId}
          linkedReviewTitle={linkedReviewTitle}
        />
      ) : null}

      {intakeModeActive && linkedReviewId === null ? (
        <ArchitectureDraftIntakeModeBanner
          status={draft?.status}
          continueHref={startReviewFromArchitectureHref(effectiveDraftId)}
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
              nextStep: isWorkingMode
                ? "Keep your edits, load the server copy, or retry save after you choose."
                : "Refresh the draft to load the latest version, then re-apply any edits you still need.",
            }}
          />
          <div className="flex flex-wrap gap-2">
            {isWorkingMode ? (
              <>
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={() => {
                    void onKeepLocalDraft();
                  }}
                  data-testid="architecture-draft-conflict-keep-mine"
                >
                  Keep mine
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onReloadDraft();
                  }}
                  data-testid="architecture-draft-conflict-keep-server"
                >
                  Keep server copy
                </Button>
              </>
            ) : (
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
            )}
          </div>
        </div>
      ) : null}

      <IntegrationConnectChecklist
        title={ARCHITECTURE_DRAFT_START_REVIEW_CHECKLIST_TITLE}
        description={draftStartReviewChecklistDescription}
        steps={draftStartReviewSteps}
        emphasizedStepId={draftStartReviewEmphasizedStepId}
        testIdPrefix="architecture-draft-start-review"
      />
    </>
  );
}
