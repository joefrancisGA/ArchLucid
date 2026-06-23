"use client";

import Link from "next/link";

import { FinishSetupWizardPanel } from "@/components/FinishSetupWizardPanel";
import { TryCliDemoCard } from "@/components/TryCliDemoCard";
import { OperatorHomeDisclosureSection } from "@/components/operator-home/OperatorHomeDisclosureSection";
import { Button } from "@/components/ui/button";

const ONBOARDING_OPTIONAL_SETUP_STORAGE_KEY = "archlucid_onboarding_disclosure_optional_setup_v1";
const ONBOARDING_CLI_TOOLS_STORAGE_KEY = "archlucid_onboarding_disclosure_cli_tools_v1";

/** Collapsed-by-default ROI, workspace, and CLI setup — not required for the first review package. */
export function OnboardingOptionalSetupSection() {
  return (
    <OperatorHomeDisclosureSection
      title="Optional setup"
      titleId="onboarding-optional-setup-heading"
      sectionTestId="onboarding-optional-setup"
      storageKey={ONBOARDING_OPTIONAL_SETUP_STORAGE_KEY}
      defaultExpanded={false}
      collapsedSummary="Configure integrations, identity, ROI baseline, and CLI access when you are ready."
    >
      <div className="space-y-6">
        <section aria-labelledby="onboarding-roi-baseline-setup-heading" data-testid="onboarding-roi-baseline-setup">
          <h3 id="onboarding-roi-baseline-setup-heading" className="m-0 text-sm font-semibold text-al-text-primary">
            ROI baseline
          </h3>
          <p className="m-0 mt-1 text-sm text-neutral-600 dark:text-neutral-400 max-w-prose">
            Add baseline assumptions so Portfolio overview can show estimated savings and sponsor ROI.
          </p>
          <div className="mt-2">
            <Button asChild size="sm" variant="outline">
              <Link href="/settings/baseline">Configure ROI baseline</Link>
            </Button>
          </div>
        </section>

        <FinishSetupWizardPanel variant="optional" />

        <OperatorHomeDisclosureSection
          title="Developer / CLI tools"
          titleId="onboarding-cli-tools-heading"
          sectionTestId="onboarding-cli-tools"
          storageKey={ONBOARDING_CLI_TOOLS_STORAGE_KEY}
          defaultExpanded={false}
          density="slim"
          collapsedSummary="Terminal workflow for evaluators who prefer the CLI."
        >
          <TryCliDemoCard />
        </OperatorHomeDisclosureSection>
      </div>
    </OperatorHomeDisclosureSection>
  );
}
