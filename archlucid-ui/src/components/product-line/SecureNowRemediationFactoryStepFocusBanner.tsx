"use client";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  SECURENOW_REMEDIATION_FACTORY_STEP_FOCUS_BODY,
  SECURENOW_REMEDIATION_FACTORY_STEP_FOCUS_HEADING,
} from "@/lib/product-line/securenow-remediation-factory-step-focus-copy";
import { cn } from "@/lib/utils";

export type SecureNowRemediationFactoryStepFocusBannerProps = {
  readonly selectedPathId: string;
};

/** Collapsed path-view mode: keep cognitive load on one ranked path. */
export function SecureNowRemediationFactoryStepFocusBanner(
  props: SecureNowRemediationFactoryStepFocusBannerProps,
): React.JSX.Element {
  const trimmedPathId = props.selectedPathId.trim();

  return (
    <div
      className="rounded-md border border-neutral-200 bg-neutral-50/80 px-3 py-2 dark:border-neutral-800 dark:bg-neutral-900/40"
      data-testid="securenow-remediation-factory-step-focus"
      role="status"
    >
      <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
        {SECURENOW_REMEDIATION_FACTORY_STEP_FOCUS_HEADING}
      </p>
      <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        {SECURENOW_REMEDIATION_FACTORY_STEP_FOCUS_BODY} Selected path:{" "}
        <span className="font-mono text-al-text-primary">{trimmedPathId}</span>
      </p>
    </div>
  );
}
