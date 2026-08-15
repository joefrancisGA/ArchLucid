"use client";

import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  countExistentialUnverifiedAssumptions,
  parseUnverifiedAssumptions,
  type UnverifiedAssumption,
} from "@/lib/review-quality/assumption-and-severity";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";

function deriveAssumptionTextsFromFindings(findings: readonly QuickDecisionFinding[]): string[] {
  const texts: string[] = [];

  for (const finding of findings) {
    if (finding.isMuted) {
      continue;
    }

    const combined = `${finding.title}\n${finding.recommendation}\n${finding.aiReasoning.reasoningTrace}`;

    if (!/assumption/i.test(combined)) {
      continue;
    }

    const trimmed = finding.title.trim();

    if (trimmed.length > 0) {
      texts.push(trimmed);
    }
  }

  return texts;
}

export type ReviewAssumptionConfirmationStripProps = {
  readonly findings: readonly QuickDecisionFinding[];
};

/** TB-2314: existential assumptions need confirm-or-caveat before finalize. */
export function ReviewAssumptionConfirmationStrip(
  props: ReviewAssumptionConfirmationStripProps,
): React.JSX.Element | null {
  const assumptions = useMemo(
    () => parseUnverifiedAssumptions(deriveAssumptionTextsFromFindings(props.findings)),
    [props.findings],
  );
  const existentialCount = countExistentialUnverifiedAssumptions(assumptions);
  const [acknowledgedIds, setAcknowledgedIds] = useState<ReadonlySet<string>>(() => new Set());

  if (assumptions.length === 0) {
    return null;
  }

  function toggleAssumption(id: string, checked: boolean): void {
    const next = new Set(acknowledgedIds);

    if (checked) {
      next.add(id);
    } else {
      next.delete(id);
    }

    setAcknowledgedIds(next);
  }

  return (
    <section
      className="rounded-md border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-800 dark:bg-neutral-900/40"
      data-testid="review-assumption-confirmation-strip"
      aria-labelledby="review-assumption-confirmation-heading"
    >
      <h3
        id="review-assumption-confirmation-heading"
        className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}
      >
        Confirm or caveat assumptions
      </h3>
      <p className={cn("m-0 mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
        {existentialCount > 0
          ? `${existentialCount} existential assumption${existentialCount === 1 ? "" : "s"} affect recovery, data class, or trust boundaries — confirm each before finalize.`
          : "Review assumption-backed findings and confirm you accept the caveat or have evidence to replace them."}
      </p>
      <ul className="m-0 mt-3 space-y-2 p-0">
        {assumptions.map((assumption: UnverifiedAssumption) => (
          <li key={assumption.id} className="flex items-start gap-2">
            <Checkbox
              id={assumption.id}
              checked={acknowledgedIds.has(assumption.id)}
              onCheckedChange={(checked) => {
                toggleAssumption(assumption.id, checked === true);
              }}
              data-testid={`assumption-ack-${assumption.id}`}
            />
            <Label htmlFor={assumption.id} className={cn("font-normal", OPERATOR_TYPOGRAPHY.body)}>
              {assumption.text}
              {assumption.existential ? (
                <span className={cn("ml-1 text-amber-800 dark:text-amber-300", OPERATOR_TYPOGRAPHY.helper)}>
                  (existential)
                </span>
              ) : null}
            </Label>
          </li>
        ))}
      </ul>
    </section>
  );
}
