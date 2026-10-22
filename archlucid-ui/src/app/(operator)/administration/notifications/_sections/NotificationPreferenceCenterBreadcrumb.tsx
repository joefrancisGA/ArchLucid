import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";

import {
  NOTIFICATION_PREFERENCE_CENTER_BREADCRUMB_ADMINISTRATION_LABEL,
  NOTIFICATION_PREFERENCE_CENTER_BREADCRUMB_ADMINISTRATION_PATH,
  NOTIFICATION_PREFERENCE_CENTER_BREADCRUMB_TOPIC_TITLE,
} from "./notification-preference-center-page-copy";

/** Administration trail for the notifications preference center (ADN). */
export function NotificationPreferenceCenterBreadcrumb(): React.JSX.Element {
  return (
    <OperatorPageBreadcrumb
      data-testid="notification-preference-center-breadcrumb"
      items={[
        {
          label: NOTIFICATION_PREFERENCE_CENTER_BREADCRUMB_ADMINISTRATION_LABEL,
          href: NOTIFICATION_PREFERENCE_CENTER_BREADCRUMB_ADMINISTRATION_PATH,
        },
        { label: NOTIFICATION_PREFERENCE_CENTER_BREADCRUMB_TOPIC_TITLE },
      ]}
    />
  );
}
