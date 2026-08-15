import { cn } from "@/lib/utils";
import Link from "next/link";
import type { ReactNode } from "react";

import { ComplianceJourneyDiligenceLink } from "@/components/marketing/ComplianceJourneyDiligenceLink";
import { ComplianceJourneyEvidenceOrientationStrip } from "@/components/marketing/ComplianceJourneyEvidenceOrientationStrip";
import { Button } from "@/components/ui/button";
import { MARKETING_LAYOUT, MARKETING_SURFACES, MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  COMPLIANCE_JOURNEY_DILIGENCE_SECTIONS,
  type ComplianceJourneyDiligenceLink as ComplianceJourneyDiligenceLinkModel,
} from "@/lib/compliance-journey-diligence-links";
import {
  COMPLIANCE_JOURNEY_PAGE_LEAD,
  COMPLIANCE_JOURNEY_PAGE_TITLE,
  COMPLIANCE_JOURNEY_PRIMARY_TRUST_CENTER_CTA_LABEL,
  COMPLIANCE_JOURNEY_STAGES,
  COMPLIANCE_JOURNEY_VERIFY_CONFIRMATION,
} from "@/lib/compliance-journey-page-copy";

function stageSecondaryLinks(stageId: string): readonly ComplianceJourneyDiligenceLinkModel[] {
  if (stageId === "what-we-publish") {
    const postureSection = COMPLIANCE_JOURNEY_DILIGENCE_SECTIONS.find((section) => section.id === "posture");

    return (postureSection?.links ?? []).filter((link) => link.id !== "trust-center");
  }

  if (stageId === "how-to-diligence") {
    const questionnaireSection = COMPLIANCE_JOURNEY_DILIGENCE_SECTIONS.find(
      (section) => section.id === "questionnaires",
    );
    const contractsSection = COMPLIANCE_JOURNEY_DILIGENCE_SECTIONS.find((section) => section.id === "contracts");

    return [...(questionnaireSection?.links ?? []), ...(contractsSection?.links ?? [])];
  }

  return [];
}

/** Buyer-facing compliance journey — marketing shell body (TB-1483, TB-1485, TB-1487). */
export function ComplianceJourneyPageBody(): ReactNode {
  return (
    <div className={cn(MARKETING_LAYOUT.sectionStack, "space-y-8")} data-testid="compliance-journey-body">
      <header className="space-y-4">
        <h1 className={cn("m-0", MARKETING_TYPOGRAPHY.pageTitle)}>{COMPLIANCE_JOURNEY_PAGE_TITLE}</h1>
        <p className={cn("m-0 max-w-prose", MARKETING_TYPOGRAPHY.lead)}>{COMPLIANCE_JOURNEY_PAGE_LEAD}</p>
        <Button variant="primary" size="default" asChild data-testid="compliance-journey-primary-trust-center-cta">
          <Link href="/trust">{COMPLIANCE_JOURNEY_PRIMARY_TRUST_CENTER_CTA_LABEL}</Link>
        </Button>
      </header>

      <div className="space-y-6" data-testid="compliance-journey-stages">
        {COMPLIANCE_JOURNEY_STAGES.map((stage) => {
          const secondaryLinks = stageSecondaryLinks(stage.id);

          return (
            <section
              key={stage.id}
              aria-labelledby={`compliance-journey-stage-${stage.id}-heading`}
              className={MARKETING_SURFACES.sectionPanel}
              data-testid={`compliance-journey-stage-${stage.id}`}
            >
              <h2
                className={cn("m-0", MARKETING_TYPOGRAPHY.sectionTitle)}
                id={`compliance-journey-stage-${stage.id}-heading`}
              >
                {stage.title}
              </h2>
              <p className={cn("m-0 mt-2 max-w-prose", MARKETING_TYPOGRAPHY.body)}>{stage.intro}</p>
              {secondaryLinks.length > 0 ? (
                <ul
                  className={cn("m-0 mt-3 list-disc space-y-2 pl-5", MARKETING_TYPOGRAPHY.body)}
                  data-testid={`compliance-journey-stage-${stage.id}-links`}
                >
                  {secondaryLinks.map((link) => (
                    <li key={link.id}>
                      <ComplianceJourneyDiligenceLink link={link} />
                    </li>
                  ))}
                </ul>
              ) : null}
              {stage.id === "how-to-diligence" ? (
                <p
                  className={cn("m-0 mt-4 max-w-prose text-al-text-secondary", MARKETING_TYPOGRAPHY.meta)}
                  data-testid="compliance-journey-verify-confirmation"
                >
                  {COMPLIANCE_JOURNEY_VERIFY_CONFIRMATION}
                </p>
              ) : null}
            </section>
          );
        })}
      </div>

      <ComplianceJourneyEvidenceOrientationStrip />
    </div>
  );
}
