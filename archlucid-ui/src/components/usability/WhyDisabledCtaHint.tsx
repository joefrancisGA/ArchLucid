"use client";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  formatWhyDisabledCtaMessage,
  type WhyDisabledCtaReason,
} from "@/lib/why-disabled-cta";

export type WhyDisabledCtaHintProps = {
  readonly reason: WhyDisabledCtaReason | null | undefined;
  readonly className?: string;
  readonly testId?: string;
  readonly id?: string;
};

/** Visible muted helper line explaining why a primary CTA is disabled (TB-2190). */
export function WhyDisabledCtaHint(props: WhyDisabledCtaHintProps): React.JSX.Element | null {
  const message = formatWhyDisabledCtaMessage(props.reason);
  const testId = props.testId ?? "why-disabled-cta-hint";

  if (message === null) {
    return null;
  }

  return (
    <p
      id={props.id}
      role="status"
      data-testid={testId}
      className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper, props.className)}
    >
      {message}
    </p>
  );
}