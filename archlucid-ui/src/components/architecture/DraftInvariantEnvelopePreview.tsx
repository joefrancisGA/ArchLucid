"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type DraftInvariantEnvelopeField = "outcome" | "intent" | "latency";

export type DraftInvariantEnvelopePreviewProps = {
  readonly baselineOutcome: string;
  readonly baselineIntent: string;
};

const FIELD_LABELS: Record<DraftInvariantEnvelopeField, string> = {
  outcome: "Business outcome",
  intent: "Architecture intent",
  latency: "Latency target (seconds)",
};

/**
 * Local envelope preview — no branch run. Full sealed Compare still requires a committed package.
 */
export function DraftInvariantEnvelopePreview(
  props: DraftInvariantEnvelopePreviewProps,
): React.JSX.Element {
  const [field, setField] = useState<DraftInvariantEnvelopeField>("outcome");
  const [draftValue, setDraftValue] = useState(props.baselineOutcome);

  function selectField(next: DraftInvariantEnvelopeField) {
    setField(next);

    if (next === "outcome") {
      setDraftValue(props.baselineOutcome);
    }
    else if (next === "intent") {
      setDraftValue(props.baselineIntent);
    }
    else {
      setDraftValue("3");
    }
  }

  const baseline =
    field === "outcome"
      ? props.baselineOutcome
      : field === "intent"
        ? props.baselineIntent
        : "3";

  const changed = draftValue !== baseline;

  return (
    <section
      className="rounded-md border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-800 dark:bg-neutral-950/40"
      data-testid="draft-invariant-envelope-preview"
    >
      <h3 className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}>
        Quick invariant envelope
      </h3>
      <p className={cn("m-0 mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
        Model one change locally. Sealed Compare against a prior package still requires a committed review record.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {(Object.keys(FIELD_LABELS) as DraftInvariantEnvelopeField[]).map((option) => (
          <Button
            key={option}
            type="button"
            size="sm"
            variant={field === option ? "secondary" : "outline"}
            data-testid={`draft-envelope-field-${option}`}
            onClick={() => selectField(option)}
          >
            {FIELD_LABELS[option]}
          </Button>
        ))}
      </div>

      <div className="mt-3 space-y-2">
        <Label htmlFor="draft-envelope-value" className={OPERATOR_TYPOGRAPHY.body}>
          {FIELD_LABELS[field]}
        </Label>
        <Textarea
          id="draft-envelope-value"
          value={draftValue}
          rows={field === "latency" ? 1 : 3}
          className={OPERATOR_TYPOGRAPHY.body}
          data-testid="draft-envelope-value"
          onChange={(event) => setDraftValue(event.target.value)}
        />
      </div>

      <dl className={cn("mt-3 grid gap-2 sm:grid-cols-2", OPERATOR_TYPOGRAPHY.body)}>
        <div>
          <dt className="font-medium text-neutral-500">Baseline</dt>
          <dd className="mt-0.5">{baseline}</dd>
        </div>
        <div>
          <dt className="font-medium text-neutral-500">Envelope note</dt>
          <dd className="mt-0.5" data-testid="draft-envelope-note">
            {changed
              ? "Change is local only — run a branch review when you need a sealed delta."
              : "No local change yet."}
          </dd>
        </div>
      </dl>
    </section>
  );
}
