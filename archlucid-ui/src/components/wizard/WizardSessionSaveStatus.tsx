"use client";

import { cn } from "@/lib/utils";

import { StatusTag } from "@/components/ui/status-tag";
import type { WizardSessionSaveState } from "@/hooks/use-wizard-session-persistence";
import { WIZARD_SESSION_AUTOSAVE_REASSURANCE } from "@/lib/create-vs-review-intake-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

type WizardSessionSaveStatusProps = {
  readonly saveState: WizardSessionSaveState;
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

/** Low-emphasis wizard session persistence indicator (TB-2157 / TB-1455 parity). */
export function WizardSessionSaveStatus(props: WizardSessionSaveStatusProps): React.JSX.Element | null {
  if (props.saveState === "idle") {
    return null;
  }

  const lastSavedLabel = formatLastSavedLabel(props.lastSavedUtc);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={cn("flex max-w-xs flex-col items-end gap-1 text-right", OPERATOR_TYPOGRAPHY.helper)}
      data-testid="wizard-session-save-status"
      data-save-state={props.saveState}
    >
      <div className="flex flex-wrap items-center justify-end gap-2">
        {props.saveState === "saved" ? (
          <>
            <StatusTag kind="ready" label="Saved" />
            {lastSavedLabel !== null ? <span className="text-al-text-secondary">{lastSavedLabel}</span> : null}
          </>
        ) : null}
        {props.saveState === "saving" ? <StatusTag kind="in-progress" label="Saving…" /> : null}
        {props.saveState === "unsaved" ? <StatusTag kind="needs-attention" label="Unsaved changes" /> : null}
      </div>
      {props.saveState === "saved" || props.saveState === "saving" ? (
        <span className="text-al-text-secondary" data-testid="wizard-session-autosave-reassurance">
          {WIZARD_SESSION_AUTOSAVE_REASSURANCE}
        </span>
      ) : null}
    </div>
  );
}
