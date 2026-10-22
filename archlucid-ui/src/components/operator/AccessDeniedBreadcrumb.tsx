import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";
import {
  ACCESS_DENIED_BREADCRUMB_HUB_LABEL,
  ACCESS_DENIED_BREADCRUMB_HUB_PATH,
  ACCESS_DENIED_BREADCRUMB_TOPIC_TITLE,
} from "@/lib/access-denied-page-copy";

/** Ancestor trail for `/403`: Welcome → Access denied. */
export function AccessDeniedBreadcrumb(): React.JSX.Element {
  return (
    <OperatorPageBreadcrumb
      data-testid="access-denied-breadcrumb"
      items={[
        { label: ACCESS_DENIED_BREADCRUMB_HUB_LABEL, href: ACCESS_DENIED_BREADCRUMB_HUB_PATH },
        { label: ACCESS_DENIED_BREADCRUMB_TOPIC_TITLE },
      ]}
    />
  );
}
