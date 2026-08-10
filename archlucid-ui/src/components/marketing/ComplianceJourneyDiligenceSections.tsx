import { ComplianceJourneyDiligenceLink } from "@/components/marketing/ComplianceJourneyDiligenceLink";
import { COMPLIANCE_JOURNEY_DILIGENCE_SECTIONS } from "@/lib/compliance-journey-diligence-links";

export function ComplianceJourneyDiligenceSections(): React.JSX.Element {
  return (
    <div className="mt-6 space-y-5" data-testid="compliance-journey-diligence-links">
      {COMPLIANCE_JOURNEY_DILIGENCE_SECTIONS.map((section) => (
        <section
          key={section.id}
          aria-labelledby={`compliance-journey-${section.id}-heading`}
          data-testid={`compliance-journey-section-${section.id}`}
        >
          <h2
            className="mb-1 text-sm font-semibold text-neutral-900 dark:text-neutral-100"
            id={`compliance-journey-${section.id}-heading`}
          >
            {section.lead}
          </h2>
          <ul className="list-disc space-y-2 pl-5 text-sm text-neutral-700 dark:text-neutral-300">
            {section.links.map((link) => (
              <li key={link.id}>
                <ComplianceJourneyDiligenceLink link={link} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
