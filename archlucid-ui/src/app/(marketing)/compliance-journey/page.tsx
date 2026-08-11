import type { Metadata } from "next";

import { ComplianceJourneyPageBody } from "@/components/marketing/ComplianceJourneyPageBody";
import { MarketingPageShell } from "@/components/marketing/MarketingPageShell";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Compliance journey",
  description: "Where ArchLucid is today on security and compliance — honest scope, no over-claims.",
};

/** Public compliance posture page — content pointers only; no new certifications claimed. */
export default function ComplianceJourneyPage() {
  return (
    <MarketingPageShell variant="reading" data-testid="compliance-journey-page">
      <ComplianceJourneyPageBody />
    </MarketingPageShell>
  );
}
