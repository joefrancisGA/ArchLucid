"use client";

export type DraftIntakeClaimSurface =
  | "structural-admission"
  | "llm-intake-reasoning"
  | "redirected-draft"
  | "admitted-draft"
  | "spawned-review";

const SURFACE_COPY: Record<DraftIntakeClaimSurface, string> = {
  "structural-admission": "Admission check — not committed review evidence",
  "llm-intake-reasoning": "LLM-assisted intake support — manual review required",
  "redirected-draft": "Intake decision receipt — not an architecture finding",
  "admitted-draft": "Admitted draft — confirm execution mode on review detail before sponsor export",
  "spawned-review": "Review queued — confirm execution mode on review detail before sponsor export",
};

export type DraftIntakeClaimLabelProps = {
  readonly surface: DraftIntakeClaimSurface;
};

/** Evidence-basis label for Socratic draft-intake surfaces (SPONSOR_CLAIM_LABEL_AUDIT). */
export function DraftIntakeClaimLabel(props: DraftIntakeClaimLabelProps) {
  return (
    <p
      className="m-0 text-xs text-neutral-600 dark:text-neutral-400"
      data-testid={`draft-intake-claim-label-${props.surface}`}
    >
      {SURFACE_COPY[props.surface]}
    </p>
  );
}
