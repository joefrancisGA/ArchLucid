"use client";

import { cn } from "@/lib/utils";

import { OPERATOR_TYPOGRAPHY, OPERATOR_SELECTION } from "@/lib/design-tokens";
import {
  REPLAY_VALIDATION_MODES,
  type ReplayValidationModeDefinition,
} from "@/lib/replay-validation-workflow";

export type ReplayValidationModeSelectorProps = {
  readonly mode: string;
  readonly disabled?: boolean;
  readonly onModeChange: (mode: string) => void;
};

export function ReplayValidationModeSelector(props: ReplayValidationModeSelectorProps) {
  const { mode, disabled = false, onModeChange } = props;

  return (
    <fieldset className="space-y-3" data-testid="replay-validation-mode-selector">
      <legend className={cn("text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>Validation depth</legend>
      <div className="grid gap-2" role="radiogroup" aria-label="Validation depth">
        {REPLAY_VALIDATION_MODES.map((definition) => (
          <ReplayValidationModeCard
            key={definition.mode}
            definition={definition}
            selected={mode === definition.mode}
            disabled={disabled}
            onSelect={() => onModeChange(definition.mode)}
          />
        ))}
      </div>
    </fieldset>
  );
}

type ReplayValidationModeCardProps = {
  readonly definition: ReplayValidationModeDefinition;
  readonly selected: boolean;
  readonly disabled: boolean;
  readonly onSelect: () => void;
};

function ReplayValidationModeCard(props: ReplayValidationModeCardProps) {
  const { definition, selected, disabled, onSelect } = props;

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      className={cn(
        "rounded-md border p-3 text-left transition-colors",
        selected
          ? OPERATOR_SELECTION.tile
          : "border-neutral-200 bg-white hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:border-neutral-700",
        disabled && "cursor-not-allowed opacity-60",
      )}
      data-testid={`replay-validation-mode-${definition.mode}`}
      onClick={onSelect}
    >
      <p className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>
        {definition.title}
      </p>
      <p className={cn("m-0 mt-1 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}>{definition.summary}</p>
      <ul className={cn("m-0 mt-2 list-disc space-y-1 pl-5 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
        {definition.bullets.map((bullet) => (
          <li key={bullet}>{bullet}</li>
        ))}
      </ul>
    </button>
  );
}
