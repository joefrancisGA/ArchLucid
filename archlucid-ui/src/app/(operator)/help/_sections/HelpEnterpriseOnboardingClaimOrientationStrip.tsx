"use client";

import { useProductLine } from "@/components/product-line/ProductLineProvider";
import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  ENTERPRISE_ONBOARDING_HELP_FOLLOW_UPS_TITLE,
  resolveEnterpriseOnboardingHelpSources,
  resolveEnterpriseOnboardingHelpSourcesIntro,
} from "@/lib/enterprise-onboarding-help-evidence-copy";

/** Sources follow-ups for `/help/enterprise-onboarding` (HEX). */
export function HelpEnterpriseOnboardingClaimOrientationStrip(): React.JSX.Element {
  const { productLine } = useProductLine();

  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="enterprise-onboarding-help"
      sourcesTestId="enterprise-onboarding-help-sources"
      sourcesTitle={ENTERPRISE_ONBOARDING_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={resolveEnterpriseOnboardingHelpSourcesIntro(productLine)}
      sources={resolveEnterpriseOnboardingHelpSources(productLine)}
    />
  );
}
