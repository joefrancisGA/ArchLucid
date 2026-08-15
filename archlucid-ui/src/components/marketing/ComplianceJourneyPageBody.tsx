import { cn } from "@/lib/utils";
import Link from "next/link";
import type { ReactNode } from "react";

import { ComplianceJourneyScopeDisclosure } from "@/components/marketing/compliance-journey/ComplianceJourneyScopeDisclosure";
import { ComplianceJourneyDiligenceLink } from "@/components/marketing/ComplianceJourneyDiligenceLink";
import { ComplianceJourneyEvidenceOrientationStrip } from "@/components/marketing/ComplianceJourneyEvidenceOrientationStrip";
import { TrustCenterRevisionHistory } from "@/components/marketing/trust-center/TrustCenterRevisionHistory";
import { Button } from "@/components/ui/button";
import { MARKETING_LAYOUT, MARKETING_SURFACES, MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  COMPLIANCE_JOURNEY_DILIGENCE_SECTIONS,
  type ComplianceJourneyDiligenceLink as ComplianceJourneyDiligenceLinkModel,
} from "@/lib/compliance-journey-diligence-links";
import { COMPLIANCE_JOURNEY_REVISION_HISTORY } from "@/lib/compliance-journey-marketing-revision-history";
import {
  COMPLIANCE_JOURNEY_HERO_ORIENTATION,
  COMPLIANCE_JOURNEY_LAST_REVIEWED_LABEL,
  COMPLIANCE_JOURNEY_PAGE_LEAD,
  COMPLIANCE_JOURNEY_PAGE_TITLE,
  COMPLIANCE_JOURNEY_PRIMARY_TRUST_CENTER_CTA_LABEL,
  COMPLIANCE_JOURNEY_STAGES,
  COMPLIANCE_JOURNEY_VERIFY_CONFIRMATION,
} from "@/lib/compliance-journey-page-copy";
import { TRUST_CENTER_PUBLIC_EVIDENCE_VERSION } from "@/lib/trust-center-buyer-content";
import { TRUST_CENTER_PUBLIC_LAYOUT } from "@/lib/trust-center-public-layout";

function stageSecondaryLinks(stageId: string): readonly ComplianceJourneyDiligenceLinkModel[] {
  if (stageId === "where-we-are") {
    return [
      {
        id: "assurance-status",
        label: "Assurance status",
        href: "/assurance-status",
        destination: "trust-center-page",
      },
      {
        id: "trust-center",
        label: "Trust Center",
        href: "/trust",
        destination: "trust-center-page",
      },
    ];
  }

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
      <a href="#compliance-journey-primary-content" className={TRUST_CENTER_PUBLIC_LAYOUT.skipLink}>
        Skip to compliance journey content
      </a>

      <header className="space-y-4 border-b border-neutral-200 pb-8 dark:border-neutral-800">
        <h1 className={cn("m-0", MARKETING_TYPOGRAPHY.pageTitle)}>{COMPLIANCE_JOURNEY_PAGE_TITLE}</h1>
        <p className={cn("m-0 max-w-prose", MARKETING_TYPOGRAPHY.lead)}>{COMPLIANCE_JOURNEY_PAGE_LEAD}</p>
        <p className={cn("m-0 max-w-prose text-al-text-secondary", MARKETING_TYPOGRAPHY.meta)}>
          {COMPLIANCE_JOURNEY_HERO_ORIENTATION}
        </p>
        <div className={TRUST_CENTER_PUBLIC_LAYOUT.metaRow} data-testid="compliance-journey-hero-meta">
          <span className={TRUST_CENTER_PUBLIC_LAYOUT.lastReviewed}>
            Last reviewed{" "}
            <time dateTime={COMPLIANCE_JOURNEY_LAST_REVIEWED_LABEL}>{COMPLIANCE_JOURNEY_LAST_REVIEWED_LABEL}</time>
          </span>
          <span className={TRUST_CENTER_PUBLIC_LAYOUT.metaSecondary}>
            Evidence pack version {TRUST_CENTER_PUBLIC_EVIDENCE_VERSION}
          </span>
        </div>
        <Button variant="primary" size="default" asChild data-testid="compliance-journey-primary-trust-center-cta">
          <Link href="/trust">{COMPLIANCE_JOURNEY_PRIMARY_TRUST_CENTER_CTA_LABEL}</Link>
        </Button>
      </header>

      <ComplianceJourneyScopeDisclosure />

      <div
        id="compliance-journey-primary-content"
        className="scroll-mt-24 space-y-6"
        data-testid="compliance-journey-stages"
      >
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

      <TrustCenterRevisionHistory entries={COMPLIANCE_JOURNEY_REVISION_HISTORY} />

      <ComplianceJourneyEvidenceOrientationStrip />
    </div>
  );
}
