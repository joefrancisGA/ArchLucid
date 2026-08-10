import Link from "next/link";

import {
  COMPLIANCE_JOURNEY_DESTINATION_LABELS,
  complianceJourneyLinkAccessibleName,
  type ComplianceJourneyDiligenceLink,
} from "@/lib/compliance-journey-diligence-links";
import { cn } from "@/lib/utils";

const linkClassName =
  "font-medium text-teal-700 underline underline-offset-2 dark:text-teal-300";

type ComplianceJourneyDiligenceLinkProps = {
  readonly link: ComplianceJourneyDiligenceLink;
};

export function ComplianceJourneyDiligenceLink(props: ComplianceJourneyDiligenceLinkProps): React.JSX.Element {
  const { link } = props;
  const destinationLabel = COMPLIANCE_JOURNEY_DESTINATION_LABELS[link.destination];

  return (
    <Link
      aria-label={complianceJourneyLinkAccessibleName(link)}
      className={linkClassName}
      data-testid={`compliance-journey-link-${link.id}`}
      href={link.href}
    >
      {link.label}
      <span className={cn("font-normal text-neutral-600 dark:text-neutral-400")}> ({destinationLabel})</span>
    </Link>
  );
}
