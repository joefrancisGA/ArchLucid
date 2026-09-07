"use client";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { useCallback, useEffect, useState } from "react";
import type { ReactElement } from "react";

import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import {
  getFindingInsightSignalStatus,
  postFindingInsightSignal,
  type FindingInsightSignalKind,
} from "@/lib/api/finding-insight-signal-api";
import { toApiLoadFailure } from "@/lib/api-load-failure";

export type FindingDidNotThinkOfThatButtonProps = {
  readonly runId: string;
  readonly findingId: string;
  readonly disabled?: boolean;
  readonly compact?: boolean;
};

/** Working-mode operator signal for insight-density measurement (DX-13). */
export function FindingDidNotThinkOfThatButton(props: FindingDidNotThinkOfThatButtonProps): ReactElement | null {
  const { runId, findingId, disabled = false, compact = false } = props;
  const { isWorkingMode } = useWorkspaceMode();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [recordedKinds, setRecordedKinds] = useState<readonly FindingInsightSignalKind[]>([]);

  const refreshStatus = useCallback(async () => {
    try {
      const status = await getFindingInsightSignalStatus(runId, findingId.trim());
      setRecordedKinds(status.kinds);
    } catch {
      setRecordedKinds([]);
    }
  }, [findingId, runId]);

  useEffect(() => {
    if (!isWorkingMode)
      return;

    void refreshStatus();
  }, [isWorkingMode, refreshStatus]);

  async function submitDidNotThinkOfThat() {
    setBusy(true);
    setNote(null);

    try {
      await postFindingInsightSignal(runId, findingId.trim(), "DidNotThinkOfThat");
      setRecordedKinds((current) =>
        current.includes("DidNotThinkOfThat") ? current : [...current, "DidNotThinkOfThat"],
      );
      setNote("Signal recorded.");
    } catch (error) {
      setNote(toApiLoadFailure(error).message);
    } finally {
      setBusy(false);
    }
  }

  if (!isWorkingMode)
    return null;

  const alreadySignaled = recordedKinds.includes("DidNotThinkOfThat");

  return (
    <div
      className={compact ? "inline-flex flex-wrap items-center gap-1" : "flex flex-wrap items-center gap-2"}
      data-testid={`finding-insight-signal-${findingId}`}
    >
      {alreadySignaled ? (
        <StatusTag kind="neutral" label="Not thought of" className="shrink-0" />
      ) : (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className={compact ? "h-7 px-2" : undefined}
          disabled={disabled || busy}
          aria-label={`Mark finding ${findingId} as not thought of`}
          onClick={() => {
            void submitDidNotThinkOfThat();
          }}
        >
          I did not think of that.
        </Button>
      )}
      {note !== null ? (
        <span className={cn("text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)} role="status">
          {note}
        </span>
      ) : null}
    </div>
  );
}
