import type { ReactNode } from "react";

import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Callout severity for a claim-discipline band. Maps onto the operator callout tokens. */
export type EvidenceOrientationCalloutTone = "warn" | "info" | "neutral";

export type EvidenceOrientationCalloutHeading = {
  readonly id: string;
  readonly text: string;
  /**
   * Renders the heading `sr-only`. Use when the band needs an accessible name but the visible
   * caution styling already communicates its purpose to sighted readers.
   */
  readonly visuallyHidden?: boolean;
};

export type EvidenceOrientationClaimCalloutProps = {
  readonly testId: string;
  /** Claim-discipline copy. Accepts nodes so a surface can inline follow-up links in the sentence. */
  readonly body: ReactNode;
  readonly tone?: EvidenceOrientationCalloutTone;
  /** `aside` where the band is a complementary region; `div` where an ancestor already owns that role. */
  readonly element?: "aside" | "div";
  readonly heading?: EvidenceOrientationCalloutHeading;
  /** Additional content below the body inside the callout, such as a "not this" bullet list. */
  readonly children?: ReactNode;
};

/** Claim-discipline band shared by help, marketing, and architecture evidence orientation strips. */
export function EvidenceOrientationClaimCallout({
  testId,
  body,
  tone = "warn",
  element = "aside",
  heading,
  children,
}: EvidenceOrientationClaimCalloutProps): React.JSX.Element {
  const CalloutElement = element;
  const hasVisibleHeading: boolean = heading !== undefined && heading.visuallyHidden !== true;

  return (
    <CalloutElement
      className={cn(DESIGN_TOKENS.callout[tone], "p-3")}
      data-testid={testId}
      aria-labelledby={heading?.id}
    >
      {heading === undefined ? null : (
        <h2
          id={heading.id}
          className={
            heading.visuallyHidden === true
              ? "sr-only"
              : cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)
          }
        >
          {heading.text}
        </h2>
      )}
      <p className={cn("m-0", hasVisibleHeading ? "mt-2" : undefined, OPERATOR_TYPOGRAPHY.body)}>{body}</p>
      {children}
    </CalloutElement>
  );
}
