"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

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
  readonly title?: string;
  readonly variant?: "primary" | "outline";
};

export function ArchitectureDraftResumeControl(
  props: ArchitectureDraftResumeControlProps,
): React.JSX.Element {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<DraftRequestStatus | null>(null);

  const openDraft = useCallback(() => {
    router.push(architectureDraftPath(props.architectureId));
  }, [props.architectureId, router]);

  const handleClick = useCallback(async () => {
    if (busy) {
      return;
    }

    trackArchitectureDraftResumeClick(props.source, props.architectureId);
    setBusy(true);

    try {
      const draft = await getDraftRequest(props.architectureId);

      if (isArchitectureDraftInReviewIntake(draft.status)) {
        setStatus(draft.status);
        setDialogOpen(true);

        return;
      }

      openDraft();
    } catch (error) {
      showError(
        "Could not open this architecture",
        isApiRequestError(error) ? error.message : undefined,
      );
    } finally {
      setBusy(false);
    }
  }, [busy, openDraft, props.architectureId, props.source]);

  const handleContinueIntake = useCallback(() => {
    setDialogOpen(false);
    router.push(startReviewFromArchitectureHref(props.architectureId));
  }, [props.architectureId, router]);

  const handleUnlock = useCallback(async () => {
    if (!architectureDraftAllowsBriefUnlock(status)) {
      return;
    }

    setBusy(true);

    try {
      await reopenDraftRequest(props.architectureId);
      setDialogOpen(false);
      openDraft();
    } catch (error) {
      showError(
        "Could not unlock this architecture",
        isApiRequestError(error) ? error.message : undefined,
      );
    } finally {
      setBusy(false);
    }
  }, [openDraft, props.architectureId, status]);

  return (
    <>
      <Button
        type="button"
        variant={props.variant ?? "outline"}
        size="sm"
        disabled={busy}
        aria-label={props.ariaLabel}
        title={props.title}
        onClick={() => {
          void handleClick();
        }}
        data-testid={props.testId}
      >
        {props.label}
      </Button>
      <ArchitectureDraftIntakeModeDialog
        open={dialogOpen}
        status={status}
        canUnlock={architectureDraftAllowsBriefUnlock(status)}
        busy={busy}
        onOpenChange={setDialogOpen}
        onContinueIntake={handleContinueIntake}
        onUnlock={() => {
          void handleUnlock();
        }}
      />
    </>
  );
}
