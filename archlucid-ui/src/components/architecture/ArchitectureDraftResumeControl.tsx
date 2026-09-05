"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, type SetStateAction } from "react";

import { ArchitectureDraftIntakeModeDialog } from "@/components/architecture/ArchitectureDraftIntakeModeDialog";
import { OperatorMutationInlineError } from "@/components/operator/OperatorMutationInlineError";
import { Button } from "@/components/ui/button";
import { getDraftRequest, reopenDraftRequest } from "@/lib/api/draft-intake-api";
import { formatVerboseApiFailureMessage } from "@/lib/resolve-api-error-message";
import {
  architectureDraftIntakeModeConfirmHrefFromSearch,
  parseArchitectureDraftIntakeModeConfirmOpenFromSearch,
  parseArchitectureDraftIntakeModeDraftIdFromSearch,
} from "@/lib/architecture/architecture-draft-intake-mode-confirm-url";
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
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const intakeModeConfirmParam = searchParams.get("intakeModeConfirm");
  const intakeModeDraftIdParam = searchParams.get("intakeModeDraftId");
  const [dialogOpen, setDialogOpenState] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<DraftRequestStatus | null>(null);
  const [inlineError, setInlineError] = useState<string | null>(null);

  const syncIntakeModeConfirmToUrl = useCallback(
    (open: boolean) => {
      if (pathname.length === 0) {
        return;
      }

      router.replace(
        architectureDraftIntakeModeConfirmHrefFromSearch(
          searchParams.toString(),
          open
            ? { confirmOpen: true, draftId: props.architectureId }
            : { confirmOpen: false, draftId: null },
          pathname,
        ),
        { scroll: false },
      );
    },
    [pathname, props.architectureId, router, searchParams],
  );

  const setDialogOpen = useCallback(
    (value: SetStateAction<boolean>) => {
      setDialogOpenState((current) => {
        const next = typeof value === "function" ? value(current) : value;
        syncIntakeModeConfirmToUrl(next);

        return next;
      });
    },
    [syncIntakeModeConfirmToUrl],
  );

  useEffect(() => {
    const confirmOpen = parseArchitectureDraftIntakeModeConfirmOpenFromSearch(intakeModeConfirmParam);
    const draftId = parseArchitectureDraftIntakeModeDraftIdFromSearch(intakeModeDraftIdParam);

    if (!confirmOpen || draftId.length === 0 || draftId !== props.architectureId) {
      setDialogOpenState(false);

      return;
    }

    let cancelled = false;

    void getDraftRequest(props.architectureId)
      .then((draft) => {
        if (cancelled) {
          return;
        }

        if (!isArchitectureDraftInReviewIntake(draft.status)) {
          return;
        }

        setStatus(draft.status);
        setDialogOpenState(true);
      })
      .catch(() => {
        if (!cancelled) {
          setDialogOpenState(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [intakeModeConfirmParam, intakeModeDraftIdParam, props.architectureId]);

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
  }, [busy, openDraft, props.architectureId, props.source, router, setDialogOpen]);

  const handleContinueIntake = useCallback(() => {
    setDialogOpen(false);
    router.push(startReviewFromArchitectureHref(props.architectureId));
  }, [props.architectureId, router, setDialogOpen]);

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
  }, [openDraft, props.architectureId, setDialogOpen, status]);

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
