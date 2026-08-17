import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";
import {
  ARCHITECTURE_INTELLIGENCE_BREADCRUMB_PARENT_HREF,
  ARCHITECTURE_INTELLIGENCE_BREADCRUMB_PARENT_LABEL,
  ARCHITECTURE_INTELLIGENCE_PAGE_TITLE,
} from "@/lib/architecture/architecture-intelligence-page-copy";

/** Core review trail for Architecture intelligence (AIN). */
export function ArchitectureIntelligenceBreadcrumb(): React.JSX.Element {
  return (
    <OperatorPageBreadcrumb
      data-testid="architecture-intelligence-breadcrumb"
      items={[
        {
          label: ARCHITECTURE_INTELLIGENCE_BREADCRUMB_PARENT_LABEL,
          href: ARCHITECTURE_INTELLIGENCE_BREADCRUMB_PARENT_HREF,
        },
        { label: ARCHITECTURE_INTELLIGENCE_PAGE_TITLE },
      ]}
    />
  );
}
