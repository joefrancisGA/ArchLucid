"use client";

import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type AccountSecurityFeedbackTone = "success" | "blocked" | "warn" | "info";

export type AccountSecurityCardFeedback = {
  readonly tone: AccountSecurityFeedbackTone;
  readonly message: string;
};

function calloutClassForTone(tone: AccountSecurityFeedbackTone): string {
  switch (tone) {
    case "success":
      return DESIGN_TOKENS.callout.success;
    case "blocked":
      return DESIGN_TOKENS.callout.blocked;
    case "warn":
      return DESIGN_TOKENS.callout.warn;
    case "info":
      return DESIGN_TOKENS.callout.info;
    default: {
      const _exhaustive: never = tone;
      return _exhaustive;
    }
  }
}

export function AccountSecurityFeedbackCallout(props: {
  readonly feedback: AccountSecurityCardFeedback;
  readonly testId: string;
  readonly actions?: React.ReactNode;
}): React.JSX.Element {
  return (
    <div
      className={cn(calloutClassForTone(props.feedback.tone), "px-3 py-2")}
      role={props.feedback.tone === "success" ? "status" : "alert"}
      data-testid={props.testId}
    >
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{props.feedback.message}</p>
      {props.actions ? <div className="mt-2 flex flex-wrap gap-2">{props.actions}</div> : null}
    </div>
  );
}
