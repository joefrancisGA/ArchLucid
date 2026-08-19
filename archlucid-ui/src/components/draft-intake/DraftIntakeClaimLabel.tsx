"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type DraftIntakeClaimSurface =
  | "architecture-creation-draft"
  | "structural-admission"
  | "llm-intake-reasoning"
  | "redirected-draft"
  | "admitted-draft"
  | "spawned-review";

import {
  GUIDED_INTAKE_CREATION_DRAFT_GUIDANCE_CALLOUT,
  GUIDED_INTAKE_DRAFT_GUIDANCE_CALLOUT,
  GUIDED_INTAKE_READY_DRAFT_CLAIM_LABEL,
} from "@/lib/guided-intake-copy";

const SURFACE_COPY: Record<DraftIntakeClaimSurface, string> = {
  "architecture-creation-draft": GUIDED_INTAKE_CREATION_DRAFT_GUIDANCE_CALLOUT,
  "structural-admission": GUIDED_INTAKE_DRAFT_GUIDANCE_CALLOUT,
  "llm-intake-reasoning": "Intake assistant notes — not part of the review evidence trail.",
  "redirected-draft": "Intake decision receipt — not an architecture finding",
  "admitted-draft": GUIDED_INTAKE_READY_DRAFT_CLAIM_LABEL,
  "spawned-review": "Review queued — confirm execution mode on review detail before sponsor export",
};

export type DraftIntakeClaimLabelProps = {
  readonly surface: DraftIntakeClaimSurface;
};

function claimLabelClassName(surface: DraftIntakeClaimSurface): string {
  if (surface === "structural-admission" || surface === "architecture-creation-draft") {
    return cn(
      "m-0 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900/40 dark:text-neutral-300",
      OPERATOR_TYPOGRAPHY.body,
    );
  }

  return (cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper));
}

/** Evidence-basis label for Socratic draft-intake surfaces (SPONSOR_CLAIM_LABEL_AUDIT). */
export function DraftIntakeClaimLabel(props: DraftIntakeClaimLabelProps) {
  return (
    <p
      className={claimLabelClassName(props.surface)}
      data-testid={`draft-intake-claim-label-${props.surface}`}
    >
      {SURFACE_COPY[props.surface]}
    </p>
  );
}
