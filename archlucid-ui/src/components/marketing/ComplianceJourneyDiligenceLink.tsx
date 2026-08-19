import Link from "next/link";

import {
  COMPLIANCE_JOURNEY_DESTINATION_LABELS,
  complianceJourneyLinkAccessibleName,
  type ComplianceJourneyDiligenceLink,
} from "@/lib/compliance-journey-diligence-links";
import { MARKETING_SURFACES, MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type ComplianceJourneyDiligenceLinkProps = {
  readonly link: ComplianceJourneyDiligenceLink;
};

export function ComplianceJourneyDiligenceLink(props: ComplianceJourneyDiligenceLinkProps): React.JSX.Element {
  const { link } = props;
  const destinationLabel = COMPLIANCE_JOURNEY_DESTINATION_LABELS[link.destination];

  return (
    <Link
      aria-label={complianceJourneyLinkAccessibleName(link)}
      className={MARKETING_SURFACES.inlineLink}
      data-testid={`compliance-journey-link-${link.id}`}
      href={link.href}
    >
      {link.label}
      <span className={cn("font-normal text-al-text-secondary", MARKETING_TYPOGRAPHY.meta)}>
        {" "}
        ({destinationLabel})
      </span>
    </Link>
  );
}
