import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";
import {
  ASSURANCE_STATUS_BREADCRUMB_HUB_LABEL,
  ASSURANCE_STATUS_BREADCRUMB_HUB_PATH,
  ASSURANCE_STATUS_BREADCRUMB_TOPIC_TITLE,
} from "@/lib/marketing/assurance-status-page-copy";

/** Ancestor trail for `/assurance-status`: Welcome → Assurance status. */
export function AssuranceStatusBreadcrumb(): React.JSX.Element {
  return (
    <OperatorPageBreadcrumb
      data-testid="assurance-status-breadcrumb"
      items={[
        { label: ASSURANCE_STATUS_BREADCRUMB_HUB_LABEL, href: ASSURANCE_STATUS_BREADCRUMB_HUB_PATH },
        { label: ASSURANCE_STATUS_BREADCRUMB_TOPIC_TITLE },
      ]}
    />
  );
}
