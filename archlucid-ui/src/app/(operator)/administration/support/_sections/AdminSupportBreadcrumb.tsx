import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";

import {
  ADMIN_SUPPORT_BREADCRUMB_ADMINISTRATION_LABEL,
  ADMIN_SUPPORT_BREADCRUMB_ADMINISTRATION_PATH,
  ADMIN_SUPPORT_BREADCRUMB_TOPIC_TITLE,
} from "./admin-support-page-copy";

/** Administration trail for the Support workspace surface (ASX). */
export function AdminSupportBreadcrumb(): React.JSX.Element {
  return (
    <OperatorPageBreadcrumb
      data-testid="admin-support-breadcrumb"
      items={[
        { label: ADMIN_SUPPORT_BREADCRUMB_ADMINISTRATION_LABEL, href: ADMIN_SUPPORT_BREADCRUMB_ADMINISTRATION_PATH },
        { label: ADMIN_SUPPORT_BREADCRUMB_TOPIC_TITLE },
      ]}
    />
  );
}
