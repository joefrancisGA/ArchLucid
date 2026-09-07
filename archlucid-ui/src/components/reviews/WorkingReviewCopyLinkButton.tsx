"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { Button } from "@/components/ui/button";
import { copyShareableOperatorLink } from "@/lib/shareable-operator-link";
import {
  WORKING_SHARE_UNLINKED_JOB_TOAST,
  workingShareHref,
} from "@/lib/architecture/working-share-href";
import { showSuccess } from "@/lib/toast";

export type WorkingReviewCopyLinkButtonProps = {
  readonly runId: string;
  readonly parentArchitectureId?: string | null;
};

/** Copies a Working architecture-first locator URL for a review job (AO-09). */
export function WorkingReviewCopyLinkButton(
  props: WorkingReviewCopyLinkButtonProps,
): React.JSX.Element | null {
  const { isWorkingMode } = useWorkspaceMode();
  const searchParams = useSearchParams();
  const [busy, setBusy] = useState(false);

  const shareTarget = useMemo(
    () =>
      workingShareHref({
        architectureId: props.parentArchitectureId,
        reviewId: props.runId,
        search: searchParams,
      }),
    [props.parentArchitectureId, props.runId, searchParams],
  );

  const onCopy = useCallback(async () => {
    setBusy(true);

    try {
      const ok = await copyShareableOperatorLink(shareTarget.href);

      if (ok) {
        showSuccess(
          shareTarget.isUnlinkedJob ? WORKING_SHARE_UNLINKED_JOB_TOAST : "Link copied to clipboard.",
        );
      }
    }
    finally {
      setBusy(false);
    }
  }, [shareTarget.href, shareTarget.isUnlinkedJob]);

  if (!isWorkingMode) {
    return null;
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="w-full justify-start"
      disabled={busy}
      onClick={() => void onCopy()}
      data-testid="working-review-copy-link"
      data-share-href={shareTarget.href}
      data-unlinked={shareTarget.isUnlinkedJob ? "true" : "false"}
    >
      Copy review link
    </Button>
  );
}
