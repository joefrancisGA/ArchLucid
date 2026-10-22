"use client";

import { cn } from "@/lib/utils";
import { useId, useState, type KeyboardEvent } from "react";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type ReviewLabelTokenInputProps = {
  labels: string[];
  onChange: (labels: string[]) => void;
  disabled?: boolean;
  describedById?: string;
  /** Stable input id so a parent `<label htmlFor>` can associate (axe label rules). */
  inputId?: string;
};

function commitToken(raw: string, labels: string[], onChange: (labels: string[]) => void): void {
  const token = raw.trim();

  if (token.length === 0) {
    return;
  }

  if (labels.some((entry) => entry.toLowerCase() === token.toLowerCase())) {
    return;
  }

  onChange([...labels, token]);
}

/**
 * Tokenized review-label filter — persisted values remain plain strings for the API.
 */
export function ReviewLabelTokenInput({
  labels,
  onChange,
  disabled = false,
  describedById,
  inputId: inputIdProp,
}: ReviewLabelTokenInputProps) {
  const generatedInputId = useId();
  const inputId = inputIdProp ?? generatedInputId;
  const [draft, setDraft] = useState("");

  function onDraftKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      commitToken(draft, labels, onChange);
      setDraft("");
    }

    if (event.key === "Backspace" && draft.length === 0 && labels.length > 0) {
      onChange(labels.slice(0, -1));
    }
  }

  return (
    <div className="space-y-2">
      <div
        className={cn(
          "flex min-h-11 flex-wrap items-center gap-2 rounded-md border border-neutral-300 bg-white px-2 py-2 dark:border-neutral-600 dark:bg-neutral-950",
          disabled && "opacity-70",
        )}
      >
        {labels.map((label) => (
          <span
            key={label}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border border-neutral-300 bg-neutral-100 px-2 py-1 dark:border-neutral-600 dark:bg-neutral-900",
              OPERATOR_TYPOGRAPHY.badge,
            )}
          >
            {label}
            <button
              type="button"
              className="rounded px-1 text-neutral-600 hover:bg-neutral-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--al-primary-action-ring)] focus-visible:ring-offset-1 dark:text-neutral-300 dark:hover:bg-neutral-800"
              aria-label={`Remove label ${label}`}
              disabled={disabled}
              onClick={() => onChange(labels.filter((entry) => entry !== label))}
            >
              ×
            </button>
          </span>
        ))}
        <input
          id={inputId}
          type="text"
          value={draft}
          disabled={disabled}
          aria-describedby={describedById}
          placeholder={labels.length === 0 ? "Production, PHI, Security review" : "Add another label"}
          className={cn("min-w-[12rem] flex-1 border-0 bg-transparent p-1 focus-visible:outline-none", OPERATOR_TYPOGRAPHY.body)}
          data-testid="alert-routing-review-labels-input"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onDraftKeyDown}
          onBlur={() => {
            commitToken(draft, labels, onChange);
            setDraft("");
          }}
        />
      </div>
    </div>
  );
}
