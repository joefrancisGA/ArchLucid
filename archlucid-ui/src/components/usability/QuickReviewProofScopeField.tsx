"use client";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { ARCHITECTURE_STRUCTURE_BUYER_LABEL } from "@/lib/usability/canonical-product-terms";

export type QuickReviewProofScopeId = "cost" | "compliance" | "topology";

export type QuickReviewProofScopeFieldProps = {
  readonly selected: readonly QuickReviewProofScopeId[];
  readonly onChange: (next: QuickReviewProofScopeId[]) => void;
};

const PROOF_SCOPE_OPTIONS: readonly { id: QuickReviewProofScopeId; label: string; capability: string }[] = [
  { id: "cost", label: "Cost", capability: "cost-estimation" },
  { id: "compliance", label: "Compliance", capability: "policy-compliance" },
  { id: "topology", label: ARCHITECTURE_STRUCTURE_BUYER_LABEL, capability: "architecture-topology" },
];

export function proofScopeToRequiredCapabilities(selected: readonly QuickReviewProofScopeId[]): string[] {
  return PROOF_SCOPE_OPTIONS.filter((option) => selected.includes(option.id)).map((option) => option.capability);
}

/** What to prove — multi-select surfaced on step 0; advanced execution modes stay in a separate disclosure. */
export function QuickReviewProofScopeField(props: QuickReviewProofScopeFieldProps): React.JSX.Element {
  function toggle(id: QuickReviewProofScopeId): void {
    const has = props.selected.includes(id);

    if (has) {
      const next = props.selected.filter((value) => value !== id);

      if (next.length === 0) {
        return;
      }

      props.onChange(next);

      return;
    }

    props.onChange([...props.selected, id]);
  }

  return (
    <fieldset className="space-y-2" data-testid="quick-review-proof-scope">
      <legend className={cn(OPERATOR_TYPOGRAPHY.label, "font-medium text-al-text-primary")}>
        What do you want proven?
      </legend>
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper, "text-al-text-secondary")}>
        Select at least one proof dimension. Policy packs and execution modes are optional under Advanced configuration.
      </p>
      <div className="flex flex-wrap gap-3" role="group" aria-label="Proof scope">
        {PROOF_SCOPE_OPTIONS.map((option) => {
          const checked = props.selected.includes(option.id);

          return (
            <label
              key={option.id}
              className={cn("inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2", OPERATOR_TYPOGRAPHY.body,
                checked
                  ? "border-al-accent-interactive bg-al-surface-raised text-al-text-primary"
                  : "border-neutral-200 bg-white text-al-text-secondary dark:border-neutral-700 dark:bg-neutral-900",
              )}
            >
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-neutral-300 text-teal-700 focus:ring-teal-600"
                checked={checked}
                onChange={() => {
                  toggle(option.id);
                }}
              />
              <span>{option.label}</span>
            </label>
          );
        })}
      </div>
      <Label className="sr-only" htmlFor="quick-review-proof-scope-hidden">
        Proof scope selection
      </Label>
    </fieldset>
  );
}
