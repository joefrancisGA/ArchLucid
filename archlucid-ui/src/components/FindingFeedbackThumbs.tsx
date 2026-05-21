"use client";

import { useState } from "react";
import type { ReactElement } from "react";

import { Button } from "@/components/ui/button";
import { postArchitectureFindingFeedback } from "@/lib/api/findings-api";
import { toApiLoadFailure } from "@/lib/api-load-failure";

export type FindingFeedbackThumbsProps = {
  readonly runId: string;
  readonly findingId: string;
  readonly disabled?: boolean;
  readonly compact?: boolean;
};

/** Inline thumbs up/down control for a finding row (ExecuteAuthority). */
export function FindingFeedbackThumbs(props: FindingFeedbackThumbsProps): ReactElement {
  const { runId, findingId, disabled = false, compact = false } = props;
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  async function submit(isHelpful: boolean) {
    setBusy(true);
    setNote(null);

    try {
      await postArchitectureFindingFeedback(runId, findingId.trim(), isHelpful);
      setNote(isHelpful ? "Thanks — marked helpful." : "Thanks — feedback recorded.");
    } catch (error) {
      setNote(toApiLoadFailure(error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className={compact ? "inline-flex flex-wrap items-center gap-1" : "flex flex-wrap items-center gap-2"}
      data-testid={`finding-feedback-${findingId}`}
    >
      {!compact ? (
        <span className="text-xs text-neutral-600 dark:text-neutral-400">Helpful?</span>
      ) : null}
      <Button
        type="button"
        size="sm"
        variant="outline"
        className={compact ? "h-7 px-2 text-xs" : undefined}
        disabled={disabled || busy}
        aria-label={`Mark finding ${findingId} helpful`}
        title="Thumbs up"
        onClick={() => void submit(true)}
      >
        👍
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className={compact ? "h-7 px-2 text-xs" : undefined}
        disabled={disabled || busy}
        aria-label={`Mark finding ${findingId} not helpful`}
        title="Thumbs down"
        onClick={() => void submit(false)}
      >
        👎
      </Button>
      {note !== null ? (
        <span className="text-xs text-neutral-600 dark:text-neutral-400" role="status">
          {note}
        </span>
      ) : null}
    </div>
  );
}
