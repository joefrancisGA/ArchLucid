"use client";

export type DraftIntakeClaimSurface =
  | "structural-admission"
  | "llm-intake-reasoning"
  | "redirected-draft"
  | "admitted-draft"
  | "spawned-review";

import { GUIDED_INTAKE_DRAFT_EVIDENCE_CALLOUT } from "@/lib/guided-intake-copy";

const SURFACE_COPY: Record<DraftIntakeClaimSurface, string> = {
  "structural-admission": GUIDED_INTAKE_DRAFT_EVIDENCE_CALLOUT,
  "llm-intake-reasoning": "Intake assistant notes — not part of the review evidence trail.",
  "redirected-draft": "Intake decision receipt — not an architecture finding",
  "admitted-draft": "Admitted draft — confirm execution mode on review detail before sponsor export",
  "spawned-review": "Review queued — confirm execution mode on review detail before sponsor export",
};

export type DraftIntakeClaimLabelProps = {
  readonly surface: DraftIntakeClaimSurface;
};

function claimLabelClassName(surface: DraftIntakeClaimSurface): string {
  if (surface === "structural-admission") {
    return "m-0 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900/40 dark:text-neutral-300";
  }

  return "m-0 text-xs text-neutral-600 dark:text-neutral-400";
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
