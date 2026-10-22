import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";
import {
  COMPLIANCE_JOURNEY_BREADCRUMB_HUB_LABEL,
  COMPLIANCE_JOURNEY_BREADCRUMB_HUB_PATH,
  COMPLIANCE_JOURNEY_BREADCRUMB_TOPIC_TITLE,
} from "@/lib/compliance-journey-page-copy";

/** Ancestor trail for `/compliance-journey`: Welcome → Compliance journey. */
export function ComplianceJourneyBreadcrumb(): React.JSX.Element {
  return (
    <OperatorPageBreadcrumb
      data-testid="compliance-journey-breadcrumb"
      items={[
        { label: COMPLIANCE_JOURNEY_BREADCRUMB_HUB_LABEL, href: COMPLIANCE_JOURNEY_BREADCRUMB_HUB_PATH },
        { label: COMPLIANCE_JOURNEY_BREADCRUMB_TOPIC_TITLE },
      ]}
    />
  );
}
