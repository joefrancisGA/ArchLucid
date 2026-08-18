import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";
import {
  SESSION_EXPIRED_BREADCRUMB_HUB_LABEL,
  SESSION_EXPIRED_BREADCRUMB_HUB_PATH,
  SESSION_EXPIRED_BREADCRUMB_TOPIC_TITLE,
} from "@/lib/auth/session-expired-page-copy";

/** Ancestor trail for `/auth/session-expired`: Welcome → Session expired. */
export function SessionExpiredBreadcrumb(): React.JSX.Element {
  return (
    <OperatorPageBreadcrumb
      data-testid="session-expired-breadcrumb"
      items={[
        { label: SESSION_EXPIRED_BREADCRUMB_HUB_LABEL, href: SESSION_EXPIRED_BREADCRUMB_HUB_PATH },
        { label: SESSION_EXPIRED_BREADCRUMB_TOPIC_TITLE },
      ]}
    />
  );
}
