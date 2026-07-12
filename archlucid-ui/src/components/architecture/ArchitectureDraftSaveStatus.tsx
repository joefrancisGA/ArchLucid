"use client";

import { cn } from "@/lib/utils";

import { StatusTag } from "@/components/ui/status-tag";
import type { ArchitectureDraftSaveState } from "@/hooks/use-architecture-draft-autosave";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

type ArchitectureDraftSaveStatusProps = {
  readonly saveState: ArchitectureDraftSaveState;
  readonly lastSavedUtc: string | null;
};

function formatLastSavedLabel(lastSavedUtc: string | null): string | null {
  if (lastSavedUtc === null) {
    return null;
  }

  const savedAt = new Date(lastSavedUtc);
  const deltaMs = Date.now() - savedAt.getTime();

  if (deltaMs < 60_000) {
    return "Saved just now";
  }

  return `Saved ${savedAt.toLocaleString()}`;
}

/** Low-emphasis architecture draft persistence indicator. */
export function ArchitectureDraftSaveStatus(props: ArchitectureDraftSaveStatusProps): React.JSX.Element {
  const lastSavedLabel = formatLastSavedLabel(props.lastSavedUtc);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={cn("flex flex-wrap items-center gap-2", OPERATOR_TYPOGRAPHY.helper)}
      data-testid="architecture-draft-save-status"
      data-save-state={props.saveState}
    >
      {props.saveState === "saved" ? (
        <>
          <StatusTag kind="ready" label="Saved" />
          {lastSavedLabel !== null ? <span className="text-al-text-secondary">{lastSavedLabel}</span> : null}
        </>
      ) : null}
      {props.saveState === "saving" ? <StatusTag kind="in-progress" label="Saving…" /> : null}
      {props.saveState === "unsaved" ? <StatusTag kind="needs-attention" label="Unsaved changes" /> : null}
      {props.saveState === "error" ? <StatusTag kind="blocked" label="Save failed" /> : null}
      {props.saveState === "offline" ? <StatusTag kind="needs-attention" label="Offline" /> : null}
    </div>
  );
}
