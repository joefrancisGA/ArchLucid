"use client";

import { useState, type FormEvent, type ReactElement } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  describeFindingsNaturalLanguageFacets,
  parseFindingsNaturalLanguageFilter,
  type FindingsNaturalLanguageFacets,
} from "@/lib/findings-natural-language-filter";
import { cn } from "@/lib/utils";

export type FindingsNaturalLanguageFilterProps = {
  readonly onApply: (facets: FindingsNaturalLanguageFacets) => void;
  readonly initialPhrase?: string;
  readonly className?: string;
  readonly disabled?: boolean;
};

/**
 * Natural-language findings filter: phrase → deterministic facets (TB-2207).
 * Complements facet chips; does not call an LLM.
 */
export function FindingsNaturalLanguageFilter(
  props: FindingsNaturalLanguageFilterProps,
): ReactElement {
  const [phrase, setPhrase] = useState(props.initialPhrase ?? "");
  const [appliedDescription, setAppliedDescription] = useState<string | null>(null);

  function applyPhrase(): void {
    const facets = parseFindingsNaturalLanguageFilter(phrase);
    setAppliedDescription(describeFindingsNaturalLanguageFacets(facets));
    props.onApply(facets);
  }

  function onSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    applyPhrase();
  }

  return (
    <form
      className={cn("space-y-2", props.className)}
      data-testid="findings-nl-filter"
      onSubmit={onSubmit}
      aria-label="Natural-language findings filter"
    >
      <Label htmlFor="findings-nl-filter-input" className={OPERATOR_TYPOGRAPHY.helper}>
        Describe findings to show
      </Label>
      <div className="flex flex-wrap items-end gap-2">
        <Input
          id="findings-nl-filter-input"
          data-testid="findings-nl-filter-input"
          value={phrase}
          disabled={props.disabled === true}
          onChange={(event) => {
            setPhrase(event.target.value);
          }}
          placeholder='Example: open high severity TLS or "private endpoint"'
          className="h-9 min-w-[16rem] flex-1"
        />
        <Button
          type="submit"
          size="sm"
          disabled={props.disabled === true}
          data-testid="findings-nl-filter-apply"
        >
          Apply
        </Button>
      </div>
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        Parses severity (critical/high/medium/low), status (open/disposed), and title keywords — no AI rewrite.
      </p>
      {appliedDescription !== null ? (
        <p
          className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="findings-nl-filter-applied"
        >
          {appliedDescription}
        </p>
      ) : null}
    </form>
  );
}