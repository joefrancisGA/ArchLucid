"use client";

import { cn } from "@/lib/utils";

import { StatusTag } from "@/components/ui/status-tag";
import type { ArchitectureDraftSaveState } from "@/hooks/use-architecture-draft-autosave";
import { ARCHITECTURE_CREATION_AUTOSAVE_REASSURANCE } from "@/lib/create-vs-review-intake-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

type ArchitectureDraftSaveStatusProps = {
  readonly saveState: ArchitectureDraftSaveState;
  readonly lastSavedUtc: string | null;
  /** When false, omit autosave reassurance (autosave disabled, e.g. post-spawn handoff lock). */
  readonly autosaveActive?: boolean;
  /** When false, omit autosave reassurance until the draft exists on the server (TB-1460). */
  readonly hasPersistedDraft?: boolean;
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
  const autosaveActive = props.autosaveActive !== false;
  const hasPersistedDraft = props.hasPersistedDraft !== false;
  const showAutosaveReassurance =
    autosaveActive &&
    hasPersistedDraft &&
    props.saveState !== "error" &&
    props.saveState !== "offline";

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={cn("flex max-w-xs flex-col items-end gap-1 text-right", OPERATOR_TYPOGRAPHY.helper)}
      data-testid="architecture-draft-save-status"
      data-save-state={props.saveState}
    >
      <div className="flex flex-wrap items-center justify-end gap-2">
        {renderSaveStatusContent(props.saveState, lastSavedLabel)}
      </div>
      {showAutosaveReassurance ? (
        <span
          className="text-al-text-secondary"
          data-testid="architecture-draft-autosave-reassurance"
        >
          {ARCHITECTURE_CREATION_AUTOSAVE_REASSURANCE}
        </span>
      ) : null}
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
