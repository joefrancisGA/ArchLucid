"use client";

import { cn } from "@/lib/utils";

import { StatusTag } from "@/components/ui/status-tag";
import type { WizardSessionSaveState } from "@/hooks/use-wizard-session-persistence";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

type WizardSessionSaveStatusProps = {
  readonly saveState: WizardSessionSaveState;
  readonly lastSavedUtc: string | null;
  /** `inline` aligns the status row with adjacent h-9 action buttons. */
  readonly layout?: "stacked" | "inline";
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

function renderWizardSessionSaveStatusContent(
  saveState: WizardSessionSaveState,
  lastSavedLabel: string | null,
): React.JSX.Element | null {
  if (saveState === "saved") {
    return (
      <>
        <StatusTag kind="ready" label="Saved" />
        {lastSavedLabel !== null ? <span className="text-al-text-secondary">{lastSavedLabel}</span> : null}
      </>
    );
  }

  if (saveState === "saving") {
    return <StatusTag kind="in-progress" label="Saving…" />;
  }

  if (saveState === "unsaved") {
    return <StatusTag kind="needs-attention" label="Unsaved changes" />;
  }

  return null;
}

/** Low-emphasis wizard session persistence indicator (TB-2157 / TB-1455 parity). */
export function WizardSessionSaveStatus(props: WizardSessionSaveStatusProps): React.JSX.Element | null {
  if (props.saveState === "idle") {
    return null;
  }

  const lastSavedLabel = formatLastSavedLabel(props.lastSavedUtc);
  const layout = props.layout ?? "stacked";
  const statusContent = renderWizardSessionSaveStatusContent(props.saveState, lastSavedLabel);

  if (layout === "inline") {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className={cn("flex h-9 items-center gap-2", OPERATOR_TYPOGRAPHY.helper)}
        data-testid="wizard-session-save-status"
        data-save-state={props.saveState}
      >
        {statusContent}
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={cn("flex max-w-xs flex-col items-end gap-1 text-right", OPERATOR_TYPOGRAPHY.helper)}
      data-testid="wizard-session-save-status"
      data-save-state={props.saveState}
    >
      <div className="flex flex-wrap items-center justify-end gap-2">{statusContent}</div>
    </div>
  );
}
