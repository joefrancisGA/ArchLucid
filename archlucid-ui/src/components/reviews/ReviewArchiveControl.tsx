"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { Button } from "@/components/ui/button";
import { useOperatorNavAuthority } from "@/components/operator/OperatorNavAuthorityProvider";
import { archiveReview } from "@/lib/api/review-archive-api";
import { REVIEWS_LIST_PATH } from "@/lib/architecture/architecture-routes";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
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
import type { RunSummary } from "@/types/authority";

export type ReviewArchiveControlProps = {
  readonly run: Pick<RunSummary, "runId" | "hasGoldenManifest" | "isArchived">;
  readonly reviewTitle: string;
  readonly buttonLabel?: string;
  readonly testId?: string;
  readonly redirectAfterArchive?: boolean;
  readonly onArchived?: () => void;
  /** Full summary snapshot for browser-local archived inventory when the list API omits archived rows. */
  readonly archivedRunSnapshot?: RunSummary;
};

/** Soft-archives an in-flight review with irreversibility warnings. */
export function ReviewArchiveControl(props: ReviewArchiveControlProps): React.JSX.Element | null {
  const router = useRouter();
  const { callerAuthorityRank, isAuthorityLoading } = useOperatorNavAuthority();
  const canExecute = !isAuthorityLoading && callerAuthorityRank >= AUTHORITY_RANK.ExecuteAuthority;
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const eligible = canArchiveReview(props.run);

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
      router.push(REVIEWS_LIST_PATH);
    }

    router.refresh();
  }, [props, router]);

  const handleConfirm = useCallback(async () => {
    setBusy(true);

    try {
      const result = await archiveReview(props.run.runId);

      if (result.ok) {
        await finishArchive();

        return;
      }

      if (result.status === 400) {
        toast.error(REVIEW_ARCHIVE_SEALED_BLOCKED_MESSAGE, { description: result.message });

        return;
      }

      toast.error(REVIEW_ARCHIVE_FAILURE_MESSAGE, { description: result.message });
    } finally {
      setBusy(false);
    }
  }, [finishArchive, props.run.runId]);

  if (!eligible || !canExecute) {
    return null;
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        data-testid={props.testId ?? `review-archive-${props.run.runId}`}
        onClick={() => setConfirmOpen(true)}
      >
        {props.buttonLabel ?? "Archive review"}
      </Button>
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
