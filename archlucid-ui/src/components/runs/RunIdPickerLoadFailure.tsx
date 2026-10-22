"use client";

import { Button } from "@/components/ui/button";

/**
 * Load failure inside the picker popup.
 *
 * The popup is the only place the failure can appear, so the retry lives here rather than in a page
 * header: a reader who opened the dropdown to pick a review has nowhere else to go.
 */
export function RunIdPickerLoadFailure({
  message,
  retrying,
  onRetry,
}: {
  readonly message: string;
  readonly retrying: boolean;
  readonly onRetry: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 px-3 py-2 text-red-700 dark:text-red-400">
      <span className="min-w-0 flex-1">{message}</span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={retrying}
        data-testid="run-id-picker-retry"
        onClick={onRetry}
      >
        {retrying ? "Retrying…" : "Try again"}
      </Button>
    </div>
  );
}
