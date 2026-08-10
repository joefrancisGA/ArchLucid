import type { Metadata } from "next";

import { ComplianceJourneyDiligenceSections } from "@/components/marketing/ComplianceJourneyDiligenceSections";
import { ComplianceJourneyEvidenceOrientationStrip } from "@/components/marketing/ComplianceJourneyEvidenceOrientationStrip";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Compliance journey",
  description: "Where ArchLucid is today on security and compliance — honest scope, no over-claims.",
};

/** Public compliance posture page — content pointers only; no new certifications claimed. */
export default function ComplianceJourneyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10" data-testid="compliance-journey-page">
      <h1 className="mb-2 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">Compliance journey</h1>
      <p className="mb-6 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
        ArchLucid is <strong>not SOC 2 attested</strong> today. We publish self-assessment material, questionnaires, and
        engineering controls so buyers can diligence the product without mistaking roadmap for certification. This page
        summarizes what is in scope now — no new certifications are claimed here.
      </p>
      <ComplianceJourneyEvidenceOrientationStrip />
      <ComplianceJourneyDiligenceSections />
    </main>
  );
}
