"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

import { FinishSetupWizardPanel } from "@/components/FinishSetupWizardPanel";
import { OperatorHomeDisclosureSection } from "@/components/operator-home/OperatorHomeDisclosureSection";
import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

const ONBOARDING_OPTIONAL_SETUP_STORAGE_KEY = "archlucid_onboarding_disclosure_optional_setup_v1";

/** Collapsed-by-default ROI and workspace setup — not required for the first review package. */
export function OnboardingOptionalSetupSection() {
  return (
    <OperatorHomeDisclosureSection
      title="Optional setup"
      titleId="onboarding-optional-setup-heading"
      sectionTestId="onboarding-optional-setup"
      storageKey={ONBOARDING_OPTIONAL_SETUP_STORAGE_KEY}
      defaultExpanded={false}
      collapsedSummary="Configure integrations, identity, and ROI baseline when you are ready."
    >
      <div className="space-y-6">
        <section aria-labelledby="onboarding-roi-baseline-setup-heading" data-testid="onboarding-roi-baseline-setup">
          <h3 id="onboarding-roi-baseline-setup-heading" className={`m-0 ${OPERATOR_TYPOGRAPHY.cardTitle}`}>
            ROI baseline
          </h3>
          <p className={cn("m-0 mt-1 max-w-prose", OPERATOR_TYPOGRAPHY.helper)}>
            Add baseline assumptions so Portfolio overview can show estimated savings and sponsor ROI.
          </p>
          <div className="mt-2">
            <Button asChild size="sm" variant="outline">
              <Link href="/settings/baseline">Configure ROI baseline</Link>
            </Button>
          </div>
        </section>

        <FinishSetupWizardPanel variant="optional" />
      </div>
    </OperatorHomeDisclosureSection>
  );
}
