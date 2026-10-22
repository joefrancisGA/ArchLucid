"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { signedRecordScopedHref } from "@/lib/signed-records-paths";
import type { ArchitectureDecisionRegisterEntry } from "@/lib/api/governance-stickiness-api";
import { OPERATOR_TYPOGRAPHY, OPERATOR_RESUME } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type DecisionRegisterContinueLastViewedRowProps = {
  readonly decision: ArchitectureDecisionRegisterEntry;
  readonly scopedRunId?: string;
};

/** Pinned continue row for the most recently viewed architecture decision. */
export function DecisionRegisterContinueLastViewedRow(
  props: DecisionRegisterContinueLastViewedRowProps,
): React.JSX.Element {
  const href = signedRecordScopedHref(props.decision.manifestId, props.scopedRunId);

  return (
    <section
      aria-labelledby="decision-register-continue-last-viewed-heading"
      className={OPERATOR_RESUME.stripSpaced}
      data-testid="decision-register-continue-last-viewed-row"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2
            id="decision-register-continue-last-viewed-heading"
            className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}
          >
            Continue last viewed decision
          </h2>
          <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            <span className="font-medium text-al-text-primary">{props.decision.title}</span>
          </p>
        </div>
        <Button
          type="button"
          variant="primary"
          size="sm"
          asChild
          data-testid="decision-register-continue-last-viewed-open"
        >
          <Link href={href}>Open decision record</Link>
        </Button>
      </div>
    </section>
  );
}
