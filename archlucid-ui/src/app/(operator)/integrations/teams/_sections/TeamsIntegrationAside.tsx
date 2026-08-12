"use client";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

const BEFORE_YOU_CONNECT_STEPS = [
  "Create an incoming webhook for the Teams channel that should receive notifications.",
  "Store the webhook URL in your organization's approved secret store.",
  "Confirm that the ArchLucid delivery identity can read that secret.",
  "Enter the secret name or reference on this page.",
  "Validate the secret, then send a test notification before saving.",
] as const;

/**
 * Setup guidance demoted from a competing about-aside (**TB-1575**).
 * Security copy is inline on the secret field; validation and test feedback stay next to the CTAs.
 */
export function TeamsIntegrationAside(): React.ReactElement {
  return (
    <div className={cn("space-y-4")} data-testid="teams-integration-aside">
      <CollapsibleSection title="Before you connect" sectionTestId="teams-before-you-connect">
        <ol className={cn("m-0 list-decimal space-y-2 pl-5", OPERATOR_TYPOGRAPHY.body)}>
          {BEFORE_YOU_CONNECT_STEPS.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </CollapsibleSection>
    </div>
  );
}
