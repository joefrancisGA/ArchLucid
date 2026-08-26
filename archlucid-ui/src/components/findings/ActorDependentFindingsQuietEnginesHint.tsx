"use client";

import Link from "next/link";
import type { ReactElement } from "react";

import { DESIGN_TOKENS, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { REVIEWS_NEW_GUIDED_INTAKE_HREF } from "@/lib/reviews-new-path-copy";
import { cn } from "@/lib/utils";

export const ACTOR_DEPENDENT_FINDINGS_QUIET_ENGINES_COPY =
  "Trust-boundary, privileged-access, and external-exposure engines did not run because this graph has no Actor nodes. Add people and systems in guided intake — IaC uploads alone do not create actors.";

export type ActorDependentFindingsQuietEnginesHintProps = {
  readonly show: boolean;
};

/** Honest findings-panel hint when actor-dependent engines stay silent (WK-18). */
export function ActorDependentFindingsQuietEnginesHint(
  props: ActorDependentFindingsQuietEnginesHintProps,
): ReactElement | null {
  if (!props.show) {
    return null;
  }

  return (
    <div
      className={cn(DESIGN_TOKENS.callout.info, "p-3")}
      role="status"
      data-testid="run-detail-actor-engines-quiet-hint"
    >
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{ACTOR_DEPENDENT_FINDINGS_QUIET_ENGINES_COPY}</p>
      <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.helper)}>
        <Link className={OPERATOR_LINK.nav} href={REVIEWS_NEW_GUIDED_INTAKE_HREF}>
          Open guided intake — People, systems, and integrations
        </Link>
      </p>
    </div>
  );
}
