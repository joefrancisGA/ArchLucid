"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { ArchitectureDraftIntakeModeDialog } from "@/components/architecture/ArchitectureDraftIntakeModeDialog";
import { OperatorMutationInlineError } from "@/components/operator/OperatorMutationInlineError";
import { Button } from "@/components/ui/button";
import { getDraftRequest, reopenDraftRequest } from "@/lib/api/draft-intake-api";
import { formatVerboseApiFailureMessage } from "@/lib/resolve-api-error-message";
import { architectureDraftSpawnedRunId } from "@/lib/architecture/architecture-draft-handoff-gate";
import {
  architectureDraftAllowsBriefUnlock,
  isArchitectureDraftInReviewIntake,
  isGuidedIntakeAccessBlocked,
  resolveGuidedIntakeBlockedRedirectHref,
} from "@/lib/architecture/architecture-draft-intake-mode";
import {
  trackArchitectureDraftResumeClick,
  type ArchitectureDraftResumeSource,
} from "@/lib/architecture/architecture-draft-resume-telemetry";
import { architectureDraftPath, startReviewFromArchitectureHref } from "@/lib/architecture/architecture-routes";
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
  const [inlineError, setInlineError] = useState<string | null>(null);

  const openDraft = useCallback(() => {
    router.push(architectureDraftPath(props.architectureId));
  }, [props.architectureId, router]);

  const handleClick = useCallback(async () => {
    if (busy) {
      return;
    }

    trackArchitectureDraftResumeClick(props.source, props.architectureId);
    setInlineError(null);
    setBusy(true);

    try {
      const draft = await getDraftRequest(props.architectureId);

      if (isGuidedIntakeAccessBlocked(draft.status)) {
        router.push(
          resolveGuidedIntakeBlockedRedirectHref(
            props.architectureId,
            architectureDraftSpawnedRunId(draft),
          ),
        );

        return;
      }

      if (isArchitectureDraftInReviewIntake(draft.status)) {
        setStatus(draft.status);
        setDialogOpen(true);

        return;
      }

      openDraft();
    } catch (error) {
      setInlineError(
        formatVerboseApiFailureMessage(error, "Could not open this architecture."),
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

    setInlineError(null);
    setBusy(true);

    try {
      await reopenDraftRequest(props.architectureId);
      setDialogOpen(false);
      openDraft();
    } catch (error) {
      setDialogOpen(false);
      setInlineError(
        formatVerboseApiFailureMessage(error, "Could not unlock this architecture."),
      );
    } finally {
      setBusy(false);
    }
  }, [openDraft, props.architectureId, status]);

  const inlineErrorTestId = props.testId
    ? `${props.testId}-inline-error`
    : "architecture-draft-resume-inline-error";

  return (
    <>
      <div className="space-y-2">
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
        {inlineError !== null ? (
          <OperatorMutationInlineError
            message={inlineError}
            testId={inlineErrorTestId}
            recoveryScenario="api-problem"
          />
        ) : null}
      </div>
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
