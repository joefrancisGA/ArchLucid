"use client";

import { ArchitectureCreationLocalDraftsPanel } from "@/components/architecture/ArchitectureCreationLocalDraftsPanel";
import { ArchitectureDraftDetailBuyerChrome } from "@/app/(operator)/architecture/architectures/_sections/ArchitectureDraftDetailBuyerChrome";
import { ArchitectureDraftGuidanceDisclosure } from "@/components/architecture/ArchitectureDraftGuidanceDisclosure";
import { ArchitectureDraftHandoffBanner } from "@/components/architecture/ArchitectureDraftHandoffBanner";
import { ArchitectureDraftIntakeModeBanner } from "@/components/architecture/ArchitectureDraftIntakeModeBanner";
import { IntegrationConnectChecklist } from "@/components/integrations/IntegrationConnectChecklist";
import { OperatorMutationInlineError } from "@/components/operator/OperatorMutationInlineError";
import { Button } from "@/components/ui/button";
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
  | "effectiveArchitectureId"
  | "canUnlockBrief"
  | "unlockBusy"
  | "onUnlockBrief"
  | "conflictMessage"
  | "onReloadDraft"
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
    effectiveArchitectureId,
    canUnlockBrief,
    unlockBusy,
    onUnlockBrief,
    conflictMessage,
    onReloadDraft,
    draftStartReviewChecklistDescription,
    draftStartReviewSteps,
    draftStartReviewEmphasizedStepId,
  } = props;

  return (
    <>
      {buyerPolishedShell ? null : <ArchitectureDraftGuidanceDisclosure />}

      {isNewDraft ? <ArchitectureCreationLocalDraftsPanel /> : null}

      {isDetailDraft && buyerPolishedShell ? <ArchitectureDraftDetailBuyerChrome /> : null}

      {linkedReviewId !== null ? (
        <ArchitectureDraftHandoffBanner
          architectureId={effectiveArchitectureId}
          linkedReviewId={linkedReviewId}
          linkedReviewTitle={linkedReviewTitle}
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
    </>
  );
}
