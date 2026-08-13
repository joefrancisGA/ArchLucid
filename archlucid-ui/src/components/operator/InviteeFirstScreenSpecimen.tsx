import type { JSX } from "react";

import {
  buildInviteeFirstScreenSpecimen,
  type InviteeFirstScreenSpecimenModel,
} from "@/lib/invitee-first-screen-specimen";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type InviteeFirstScreenSpecimenProps = {
  readonly className?: string;
  /** Optional override for tests; defaults to {@link buildInviteeFirstScreenSpecimen}. */
  readonly model?: InviteeFirstScreenSpecimenModel;
};

/**
 * TB-2235 — Compact specimen steps for invited reviewers (finding → disposition → comment).
 * Distinct from SpecimenDeliverablePreviewCallout (creator pre-intake preview).
 */
export function InviteeFirstScreenSpecimen(
  props: InviteeFirstScreenSpecimenProps,
): JSX.Element {
  const model = props.model ?? buildInviteeFirstScreenSpecimen();

  return (
    <aside
      className={cn(
        "space-y-2 rounded-md border border-neutral-200 bg-neutral-50/50 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900/30",
        props.className,
      )}
      aria-labelledby="invitee-first-screen-specimen-heading"
      data-testid="invitee-first-screen-specimen"
    >
      <h3
        id="invitee-first-screen-specimen-heading"
        className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.helper)}
      >
        {model.heading}
      </h3>
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{model.lead}</p>
      <ol
        className={cn(
          "m-0 list-decimal space-y-1 pl-5 text-al-text-primary",
          OPERATOR_TYPOGRAPHY.helper,
        )}
      >
        {model.steps.map((step) => (
          <li key={step.id} data-testid={`invitee-first-screen-specimen-step-${step.id}`}>
            <span className="font-medium">{step.label}</span>
            {": "}
            {step.body}
          </li>
        ))}
      </ol>
    </aside>
  );
}
