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
import { architectureDraftPath, startReviewFromDraftContextHref } from "@/lib/architecture/architecture-routes";
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
            ? { confirmOpen: true, draftId: props.draftId }
            : { confirmOpen: false, draftId: null },
          pathname,
        ),
        { scroll: false },
      );
    },
    [pathname, props.draftId, router, searchParams],
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

    if (!confirmOpen || draftId.length === 0 || draftId !== props.draftId) {
      setDialogOpenState(false);

      return;
    }

    let cancelled = false;

    void getDraftRequest(props.draftId)
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
  }, [intakeModeConfirmParam, intakeModeDraftIdParam, props.draftId]);

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
      setInlineError(
        formatVerboseApiFailureMessage(error, "Could not unlock this architecture."),
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
