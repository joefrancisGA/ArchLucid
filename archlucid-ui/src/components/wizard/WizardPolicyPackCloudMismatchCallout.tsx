"use client";

import { cn } from "@/lib/utils";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { POLICY_PACK_CLOUD_MISMATCH_MESSAGE } from "@/lib/review-quality/review-intake-quality-gates";

export type WizardPolicyPackCloudMismatchCalloutProps = {
  readonly detail: string;
};

/** TB-2322 — wizard parity with guided intake policy-pack ↔ cloud-target gate. */
export function WizardPolicyPackCloudMismatchCallout(
  props: WizardPolicyPackCloudMismatchCalloutProps,
): React.JSX.Element {
  return (
    <p
      role="alert"
      className={cn(
        "rounded-md border border-amber-600/40 bg-amber-50 px-3 py-2 text-amber-950 dark:border-amber-700/50 dark:bg-amber-950/40 dark:text-amber-100",
        OPERATOR_TYPOGRAPHY.body,
      )}
      data-testid="wizard-policy-pack-cloud-mismatch"
    >
      {POLICY_PACK_CLOUD_MISMATCH_MESSAGE} {props.detail}
    </p>
  );
}
