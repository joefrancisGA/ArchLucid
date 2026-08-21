"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ArchitectureDraftIntakeModeDialog } from "@/components/architecture/ArchitectureDraftIntakeModeDialog";
import { Button } from "@/components/ui/button";
import { getDraftRequest, reopenDraftRequest } from "@/lib/api/draft-intake-api";
import { isApiRequestError } from "@/lib/api-request-error";
import {
  architectureDraftAllowsBriefUnlock,
  isArchitectureDraftInReviewIntake,
} from "@/lib/architecture/architecture-draft-intake-mode";
import {
  trackArchitectureDraftResumeClick,
  type ArchitectureDraftResumeSource,
} from "@/lib/architecture/architecture-draft-resume-telemetry";
import { architectureDraftPath, startReviewFromArchitectureHref } from "@/lib/architecture/architecture-routes";
import { showError } from "@/lib/toast";
import type { DraftRequestStatus } from "@/types/draft-intake";

type ArchitectureDraftResumeControlProps = {
  readonly architectureId: string;
  readonly label: string;
  readonly source: ArchitectureDraftResumeSource;
  readonly testId?: string;
  readonly ariaLabel?: string;
  readonly variant?: "outline" | "primary";
};

function intakeResumeFailureMessage(error: unknown): string {
  if (isApiRequestError(error) && error.httpStatus === 404) {
    return "That architecture draft could not be found.";
  }

  return "Could not open this architecture draft. Try again.";
}

/** Continue-editing control that warns before opening a draft already in review intake. */
export function ArchitectureDraftResumeControl(
  props: ArchitectureDraftResumeControlProps,
): React.JSX.Element {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [intakeStatus, setIntakeStatus] = useState<DraftRequestStatus>("Admitted");

  const draftPath = architectureDraftPath(props.architectureId);
  const intakeHref = startReviewFromArchitectureHref(props.architectureId);
  const canUnlock = architectureDraftAllowsBriefUnlock(intakeStatus);

  const openDraft = () => {
    trackArchitectureDraftResumeClick(props.source, props.architectureId);
    router.push(draftPath);
  };

  const openIntake = () => {
    trackArchitectureDraftResumeClick(props.source, props.architectureId);
    router.push(intakeHref);
  };

  const handleContinueClick = async () => {
    if (busy) {
      return;
    }

    setBusy(true);

    try {
      const draft = await getDraftRequest(props.architectureId);

      if (isArchitectureDraftInReviewIntake(draft.status)) {
        setIntakeStatus(draft.status);
        setDialogOpen(true);

        return;
      }

      openDraft();
    } catch (error) {
      showError(intakeResumeFailureMessage(error));
    } finally {
      setBusy(false);
    }
  };

  const handleUnlock = async () => {
    if (busy) {
      return;
    }

    setBusy(true);

    try {
      await reopenDraftRequest(props.architectureId);
      setDialogOpen(false);
      openDraft();
    } catch (error) {
      showError(intakeResumeFailureMessage(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant={props.variant ?? "outline"}
        size="sm"
        disabled={busy}
        aria-label={props.ariaLabel}
        data-testid={props.testId}
        onClick={() => {
          void handleContinueClick();
        }}
      >
        {props.label}
      </Button>
      <ArchitectureDraftIntakeModeDialog
        open={dialogOpen}
        status={intakeStatus}
        canUnlock={canUnlock}
        busy={busy}
        onOpenChange={setDialogOpen}
        onContinueIntake={() => {
          setDialogOpen(false);
          openIntake();
        }}
        onUnlock={() => {
          void handleUnlock();
        }}
      />
    </>
  );
}
