"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { commitHrefIfChanged, readWindowLocationSearch } from "@/lib/navigation/replace-if-href-changed";

import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { Button } from "@/components/ui/button";
import { useOperatorNavAuthority } from "@/components/operator/OperatorNavAuthorityProvider";
import { archiveReview } from "@/lib/api/review-archive-api";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { reviewArchiveMutationBlockedReason } from "@/lib/runs/review-archive-mutation-blocked-reason";
import { REVIEWS_LIST_PATH } from "@/lib/architecture/architecture-routes";
import { resolveReviewArchiveRedirectHref } from "@/lib/resolve-review-archive-redirect-href";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { useWorkOwnershipDeletePolicyQuery } from "@/hooks/use-work-ownership-delete-policy-query";
import { canArchiveReview } from "@/lib/review-archive-eligibility";
import {
  REVIEW_ARCHIVE_CONFIRM_ACTION_LABEL,
  REVIEW_ARCHIVE_CONFIRM_CANCEL_LABEL,
  REVIEW_ARCHIVE_CONFIRM_TITLE,
  REVIEW_ARCHIVE_FAILURE_MESSAGE,
  REVIEW_ARCHIVE_SEALED_BLOCKED_MESSAGE,
  REVIEW_ARCHIVE_SUCCESS_TOAST,
  reviewArchiveConfirmDescription,
} from "@/lib/review-archive-confirm-copy";
import { invalidateRunsByProjectPagedCache } from "@/lib/runs-by-project-paged-client";
import { addArchivedReviewToClientCache } from "@/lib/archived-reviews-client-cache";
import { ARCHIVED_REVIEWS_CLIENT_CACHE_CHANGED_EVENT } from "@/hooks/use-archived-reviews-client-cache";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { RunSummary } from "@/types/authority";
import {
  parseReviewArchiveConfirmOpenFromSearch,
  parseReviewArchiveRunIdFromSearch,
  reviewArchiveConfirmHrefFromSearch,
} from "@/lib/reviews/review-archive-confirm-url";

export type ReviewArchiveControlProps = {
  readonly run: Pick<RunSummary, "runId" | "hasGoldenManifest" | "isArchived" | "createdByUserId">;
  readonly reviewTitle: string;
  readonly buttonLabel?: string;
  readonly testId?: string;
  readonly redirectAfterArchive?: boolean;
  readonly onArchived?: () => void;
  /** Full summary snapshot for browser-local archived inventory when the list API omits archived rows. */
  readonly archivedRunSnapshot?: RunSummary;
  /** Menu-item presentation for row overflow menus on the reviews hub. */
  readonly presentation?: "button" | "menu-item";
};

/** Soft-archives an in-flight review with irreversibility warnings. */
export function ReviewArchiveControl(props: ReviewArchiveControlProps): React.JSX.Element | null {
  const router = useRouter();
  const pathname = usePathname() ?? REVIEWS_LIST_PATH;
  const { callerAuthorityRank, currentPrincipal, isAuthorityLoading } = useOperatorNavAuthority();
  const policyQuery = useWorkOwnershipDeletePolicyQuery();
  const { isWorkingMode } = useWorkspaceMode();
  const canExecute = !isAuthorityLoading && callerAuthorityRank >= AUTHORITY_RANK.ExecuteAuthority;
  const readArchiveUrlState = (): { runId: string | null; confirmOpen: boolean } => {
    const params = new URLSearchParams(typeof window === "undefined" ? "" : window.location.search);

    return {
      runId: parseReviewArchiveRunIdFromSearch(params.get("archiveRunId")),
      confirmOpen: parseReviewArchiveConfirmOpenFromSearch(params.get("archiveConfirm")),
    };
  };
  const initialArchiveUrlState = readArchiveUrlState();
  const [confirmOpen, setConfirmOpenState] = useState(
    initialArchiveUrlState.confirmOpen && initialArchiveUrlState.runId === props.run.runId,
  );
  const confirmOpenRef = useRef(confirmOpen);
  confirmOpenRef.current = confirmOpen;
  const [busy, setBusy] = useState(false);

  const syncArchiveConfirmToUrl = useCallback(
    (open: boolean) => {
      commitHrefIfChanged(
        reviewArchiveConfirmHrefFromSearch(
          readWindowLocationSearch(),
          {
            runId: open ? props.run.runId : null,
            confirmOpen: open,
          },
          pathname,
        ),
        { notify: false },
      );
    },
    [pathname, props.run.runId],
  );

  const setConfirmOpen = useCallback(
    (open: boolean) => {
      if (confirmOpenRef.current === open) {
        return;
      }

      confirmOpenRef.current = open;
      setConfirmOpenState(open);
      syncArchiveConfirmToUrl(open);
    },
    [syncArchiveConfirmToUrl],
  );

  useEffect(() => {
    const syncConfirmOpenFromUrl = (): void => {
      const { runId, confirmOpen: urlConfirmOpen } = readArchiveUrlState();
      const next = urlConfirmOpen && runId === props.run.runId;

      if (confirmOpenRef.current === next) {
        return;
      }

      confirmOpenRef.current = next;
      setConfirmOpenState(next);
    };

    syncConfirmOpenFromUrl();
    window.addEventListener("popstate", syncConfirmOpenFromUrl);

    return () => {
      window.removeEventListener("popstate", syncConfirmOpenFromUrl);
    };
  }, [props.run.runId]);

  const eligible = canArchiveReview(props.run, {
    callerAuthorityRank,
    allowCreatorDeleteOwnedWork: policyQuery.data?.allowCreatorDeleteOwnedWork ?? true,
    callerPrincipal: currentPrincipal,
  });

  const finishArchive = useCallback(async () => {
    if (props.archivedRunSnapshot !== undefined) {
      addArchivedReviewToClientCache({ ...props.archivedRunSnapshot, isArchived: true });
      window.dispatchEvent(new Event(ARCHIVED_REVIEWS_CLIENT_CACHE_CHANGED_EVENT));
    }

    await invalidateRunsByProjectPagedCache();
    toast.success(REVIEW_ARCHIVE_SUCCESS_TOAST);
    props.onArchived?.();
    setConfirmOpen(false);

    if (props.redirectAfterArchive === true) {
      router.push(resolveReviewArchiveRedirectHref(isWorkingMode));
    }

    router.refresh();
  }, [isWorkingMode, props, router, setConfirmOpen]);

  const handleConfirm = useCallback(async () => {
    setBusy(true);

    try {
      const result = await archiveReview(props.run.runId);

      if (result.ok) {
        await finishArchive();

        return;
      }

      const failure = {
        message: result.message,
        httpStatus: result.status,
        correlationId: null,
        problem: null,
        retryAfterSeconds: null,
      } satisfies ApiLoadFailureState;
      const blocked = reviewArchiveMutationBlockedReason(failure);

      if (result.status === 400 || result.status === 409) {
        toast.error(blocked ?? REVIEW_ARCHIVE_SEALED_BLOCKED_MESSAGE, {
          description: blocked === null ? result.message : undefined,
        });

        return;
      }

      toast.error(blocked ?? REVIEW_ARCHIVE_FAILURE_MESSAGE, {
        description: blocked === null ? result.message : undefined,
      });
    } finally {
      setBusy(false);
    }
  }, [finishArchive, props.run.runId]);

  if (!eligible || !canExecute) {
    return null;
  }

  const archiveLabel = props.buttonLabel ?? "Archive review";
  const presentation = props.presentation ?? "button";

  return (
    <>
      {presentation === "menu-item" ? (
        <button
          type="button"
          className={cn(
            "block w-full rounded px-2 py-1.5 text-left text-al-text-primary hover:bg-neutral-100 dark:hover:bg-neutral-900",
            OPERATOR_TYPOGRAPHY.helper,
          )}
          data-testid={props.testId ?? `review-archive-${props.run.runId}`}
          onClick={() => setConfirmOpen(true)}
        >
          {archiveLabel}
        </button>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          data-testid={props.testId ?? `review-archive-${props.run.runId}`}
          onClick={() => setConfirmOpen(true)}
        >
          {archiveLabel}
        </Button>
      )}
      <ConfirmationDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          if (!busy) {
            setConfirmOpen(open);
          }
        }}
        title={REVIEW_ARCHIVE_CONFIRM_TITLE}
        description={reviewArchiveConfirmDescription(props.reviewTitle)}
        confirmLabel={REVIEW_ARCHIVE_CONFIRM_ACTION_LABEL}
        cancelLabel={REVIEW_ARCHIVE_CONFIRM_CANCEL_LABEL}
        variant="destructive"
        busy={busy}
        onConfirm={() => void handleConfirm()}
      />
    </>
  );
}
