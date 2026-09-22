"use client";

import type { ReactElement } from "react";

import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { resolveIntegrationEventsDlqCareerHonesty } from "@/lib/internal/integration-events-dlq-career-honesty";
import { cn } from "@/lib/utils";

export type IntegrationEventsDlqCareerHonestyStripProps = {
  readonly className?: string;
};

/** CG-094 — DLQ rows are ops triage, not Career-complete proof. */
export function IntegrationEventsDlqCareerHonestyStrip(
  props: IntegrationEventsDlqCareerHonestyStripProps,
): ReactElement {
  const presentation = resolveIntegrationEventsDlqCareerHonesty();

  return (
    <div
      className={cn(DESIGN_TOKENS.callout.info, "p-4", props.className)}
      data-testid="integration-events-dlq-career-honesty-strip"
      role="status"
    >
      <p
        className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}
        data-testid="integration-events-dlq-career-honesty-title"
      >
        {presentation.title}
      </p>
      <p
        className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
        data-testid="integration-events-dlq-career-honesty-body"
      >
        {presentation.body}
      </p>
    </div>
  );
}
