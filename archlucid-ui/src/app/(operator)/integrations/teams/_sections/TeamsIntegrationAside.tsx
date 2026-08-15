"use client";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { TEAMS_INTEGRATION_BEFORE_YOU_CONNECT_STEPS } from "@/lib/teams-integration-page-copy";
import { cn } from "@/lib/utils";

/**
 * Setup guidance demoted from a competing about-aside (**TB-1575**).
 * Security copy is inline on the secret field; validation and test feedback stay next to the CTAs.
 */
export function TeamsIntegrationAside(): React.ReactElement {
  return (
    <div className={cn("space-y-4")} data-testid="teams-integration-aside">
      <CollapsibleSection title="Before you connect" sectionTestId="teams-before-you-connect">
        <ol className={cn("m-0 list-decimal space-y-2 pl-5", OPERATOR_TYPOGRAPHY.body)}>
          {TEAMS_INTEGRATION_BEFORE_YOU_CONNECT_STEPS.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </CollapsibleSection>
    </div>
  );
}
