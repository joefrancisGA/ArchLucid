"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type SetStateAction } from "react";

import { ArchitectureDraftIntakeModeDialog } from "@/components/architecture/ArchitectureDraftIntakeModeDialog";
import { OperatorMutationInlineError } from "@/components/operator/OperatorMutationInlineError";
import { Button } from "@/components/ui/button";
import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { getDraftRequest, reopenDraftRequest } from "@/lib/api/draft-intake-api";
import { architectureDraftIntakeMutationBlockedReason } from "@/lib/architecture/architecture-draft-blocked-reason";
import { toApiLoadFailure } from "@/lib/api-load-failure";
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
import { architectureDraftPath, startReviewFromDraftContextHref } from "@/lib/architecture/architecture-routes";
import { commitHrefIfChanged, readWindowLocationSearch } from "@/lib/navigation/replace-if-href-changed";
import type { DraftRequestStatus } from "@/types/draft-intake";

type ArchitectureDraftResumeControlProps = {
  readonly draftId: string;
  readonly label: string;
  readonly source: ArchitectureDraftResumeSource;
  readonly parentArchitectureId?: string | null;
  readonly draftArchitectureId?: string | null;
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
  const { isWorkingMode } = useWorkspaceMode();
  const readIntakeModeConfirmFromUrl = (): { confirmOpen: boolean; draftId: string } => {
    const params = new URLSearchParams(typeof window === "undefined" ? "" : window.location.search);

    return {
      confirmOpen: parseArchitectureDraftIntakeModeConfirmOpenFromSearch(params.get("intakeModeConfirm")),
      draftId: parseArchitectureDraftIntakeModeDraftIdFromSearch(params.get("intakeModeDraftId")),
    };
  };
  const [dialogOpen, setDialogOpenState] = useState(false);
  const dialogOpenRef = useRef(dialogOpen);
  dialogOpenRef.current = dialogOpen;
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<DraftRequestStatus | null>(null);
  const [inlineError, setInlineError] = useState<string | null>(null);

  const syncIntakeModeConfirmToUrl = useCallback(
    (open: boolean) => {
      if (pathname.length === 0) {
        return;
      }

      commitHrefIfChanged(
        architectureDraftIntakeModeConfirmHrefFromSearch(
          readWindowLocationSearch(),
          open
            ? { confirmOpen: true, draftId: props.draftId }
            : { confirmOpen: false, draftId: null },
          pathname,
        ),
        { notify: false },
      );
    },
    [pathname, props.draftId],
  );

  const setDialogOpen = useCallback(
    (value: SetStateAction<boolean>) => {
      setDialogOpenState((current) => {
        const next = typeof value === "function" ? value(current) : value;

        if (dialogOpenRef.current === next) {
          return current;
        }

        dialogOpenRef.current = next;
        syncIntakeModeConfirmToUrl(next);

        return next;
      });
    },
    [syncIntakeModeConfirmToUrl],
  );

  useEffect(() => {
    let cancelled = false;

    const syncDialogOpenFromUrl = (): void => {
      const { confirmOpen, draftId } = readIntakeModeConfirmFromUrl();

      if (!confirmOpen || draftId.length === 0 || draftId !== props.draftId) {
        if (dialogOpenRef.current) {
          dialogOpenRef.current = false;
          setDialogOpenState(false);
        }

        return;
      }

      void getDraftRequest(props.draftId)
        .then((draft) => {
          if (cancelled) {
            return;
          }

          if (!isArchitectureDraftInReviewIntake(draft.status)) {
            return;
          }

          setStatus(draft.status);

          if (!dialogOpenRef.current) {
            dialogOpenRef.current = true;
            setDialogOpenState(true);
          }
        })
        .catch(() => {
          if (!cancelled && dialogOpenRef.current) {
            dialogOpenRef.current = false;
            setDialogOpenState(false);
          }
        });
    };

    syncDialogOpenFromUrl();
    window.addEventListener("popstate", syncDialogOpenFromUrl);

    return () => {
      cancelled = true;
      window.removeEventListener("popstate", syncDialogOpenFromUrl);
    };
  }, [props.draftId]);

  const openDraft = useCallback(() => {
    router.push(architectureDraftPath(props.draftId));
  }, [props.draftId, router]);

  const handleClick = useCallback(async () => {
    if (busy) {
      return;
    }

    trackArchitectureDraftResumeClick(props.source, props.draftId);
    setInlineError(null);
    setBusy(true);

    try {
      const draft = await getDraftRequest(props.draftId);

      if (isGuidedIntakeAccessBlocked(draft.status)) {
        router.push(
          resolveGuidedIntakeBlockedRedirectHref(
            props.draftId,
            architectureDraftSpawnedRunId(draft),
            { workingMode: isWorkingMode },
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
  }, [busy, openDraft, props.draftId, props.source, router, setDialogOpen]);

  const handleContinueIntake = useCallback(() => {
    setDialogOpen(false);
    router.push(
      startReviewFromDraftContextHref({
        parentArchitectureId: props.parentArchitectureId,
        draftArchitectureId: props.draftArchitectureId,
        legacyDraftId: props.draftId,
      }),
    );
  }, [props.draftArchitectureId, props.draftId, props.parentArchitectureId, router, setDialogOpen]);

  const handleUnlock = useCallback(async () => {
    if (!architectureDraftAllowsBriefUnlock(status)) {
      return;
    }

    setInlineError(null);
    setBusy(true);

    try {
      await reopenDraftRequest(props.draftId);
      setDialogOpen(false);
      openDraft();
    } catch (error) {
      setDialogOpen(false);
      const failure = toApiLoadFailure(error);
      setInlineError(
        architectureDraftIntakeMutationBlockedReason(failure)
          ?? formatVerboseApiFailureMessage(error, "Could not unlock this architecture."),
      );
    } finally {
      setBusy(false);
    }
  }, [openDraft, props.draftId, setDialogOpen, status]);

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
