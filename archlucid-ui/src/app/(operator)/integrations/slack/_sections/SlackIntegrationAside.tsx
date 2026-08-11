"use client";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { SLACK_INTEGRATION_SECURITY_NOTE } from "@/lib/slack-integration-page-copy";
import { cn } from "@/lib/utils";

/** Security note demoted from a competing about-aside (**TB-1575**). */
export function SlackIntegrationAside(): React.ReactElement {
  return (
    <CollapsibleSection
      title="Security"
      defaultOpen={false}
      sectionTestId="slack-integration-aside"
    >
      <p className={cn("m-0 leading-relaxed text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        {SLACK_INTEGRATION_SECURITY_NOTE}
      </p>
    </CollapsibleSection>
  );
}
