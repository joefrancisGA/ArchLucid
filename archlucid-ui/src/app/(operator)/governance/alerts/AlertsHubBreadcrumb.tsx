import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";
import {
  ALERTS_INBOX_BREADCRUMB_GOVERNANCE_HREF,
  ALERTS_INBOX_BREADCRUMB_GOVERNANCE_LABEL,
  ALERTS_INBOX_BREADCRUMB_TOPIC_TITLE,
} from "@/lib/alerts-inbox-page-copy";

/** Governance trail for `/governance/alerts`: Governance → Alerts. */
export function AlertsHubBreadcrumb(): React.JSX.Element {
  return (
    <OperatorPageBreadcrumb
      data-testid="alerts-hub-breadcrumb"
      items={[
        { label: ALERTS_INBOX_BREADCRUMB_GOVERNANCE_LABEL, href: ALERTS_INBOX_BREADCRUMB_GOVERNANCE_HREF },
        { label: ALERTS_INBOX_BREADCRUMB_TOPIC_TITLE },
      ]}
    />
  );
}
