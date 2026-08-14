import type { ReactNode } from "react";

import {
  EVIDENCE_CLAIM_STYLE,
  EVIDENCE_ORIENTATION_HEADING_CLASS,
  type EvidenceOrientationClaimStyle,
} from "@/components/evidence-orientation/evidence-orientation-styles";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type EvidenceOrientationCalloutHeading = {
  readonly text: string;
  /**
   * Set when the heading should also name the band via `aria-labelledby`. Omit on evaluation surfaces,
   * whose published DOM carries a plain heading with no id.
   */
  readonly id?: string;
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
  readonly style?: EvidenceOrientationClaimStyle;
  /** `aside` where the band is a complementary region; `div` where an ancestor already owns that role. */
  readonly element?: "aside" | "div";
  readonly heading?: EvidenceOrientationCalloutHeading;
  /** Optional body scale override — help strips pass {@link HELP_PAGE_LAYOUT.readingBody} for strip parity. */
  readonly bodyClassName?: string;
  /** Additional content below the body inside the callout, such as a "not this" bullet list. */
  readonly children?: ReactNode;
};

/** Claim-discipline band shared by help, marketing, and architecture evidence orientation strips. */
export function EvidenceOrientationClaimCallout({
  testId,
  body,
  style = EVIDENCE_CLAIM_STYLE.operatorWarn,
  element = "aside",
  heading,
  bodyClassName,
  children,
}: EvidenceOrientationClaimCalloutProps): React.JSX.Element {
  const CalloutElement = element;
  const hasVisibleHeading: boolean = heading !== undefined && heading.visuallyHidden !== true;

  return (
    <CalloutElement className={style.panel} data-testid={testId} aria-labelledby={heading?.id}>
      {heading === undefined ? null : (
        <h2
          id={heading.id}
          className={heading.visuallyHidden === true ? "sr-only" : EVIDENCE_ORIENTATION_HEADING_CLASS}
        >
          {heading.text}
        </h2>
      )}
      <p
        className={cn(
          "m-0",
          hasVisibleHeading ? "mt-2" : undefined,
          style.body,
          bodyClassName ?? OPERATOR_TYPOGRAPHY.body,
        )}
      >
        {body}
      </p>
      {children}
    </CalloutElement>
  );
}
