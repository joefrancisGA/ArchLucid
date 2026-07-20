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
      {renderSaveStatusContent(props.saveState, lastSavedLabel)}
    </div>
  );
}

function renderSaveStatusContent(
  saveState: ArchitectureDraftSaveState,
  lastSavedLabel: string | null,
): React.ReactNode {
  switch (saveState) {
    case "idle":
      // Pristine draft (including auto-created empty drafts) — no "Saved" claim yet.
      return null;
    case "saved":
      return (
        <>
          <StatusTag kind="ready" label="Saved" />
          {lastSavedLabel !== null ? <span className="text-al-text-secondary">{lastSavedLabel}</span> : null}
        </>
      );
    case "saving":
      return <StatusTag kind="in-progress" label="Saving…" />;
    case "unsaved":
      return <StatusTag kind="needs-attention" label="Unsaved changes" />;
    case "error":
      return <StatusTag kind="blocked" label="Save failed" />;
    case "offline":
      return <StatusTag kind="needs-attention" label="Offline" />;
    default: {
      const _exhaustive: never = saveState;

      return _exhaustive;
    }
  }
}
