import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";

import {
  ROLE_MAPPING_SETTINGS_BREADCRUMB_ADMINISTRATION_LABEL,
  ROLE_MAPPING_SETTINGS_BREADCRUMB_ADMINISTRATION_PATH,
  ROLE_MAPPING_SETTINGS_BREADCRUMB_HUB_LABEL,
  ROLE_MAPPING_SETTINGS_BREADCRUMB_HUB_PATH,
  ROLE_MAPPING_SETTINGS_BREADCRUMB_TOPIC_TITLE,
} from "./role-mapping-settings-page-copy";

/** Administration trail for role mapping settings (ADO). */
export function IdentityProvidersRoleMappingBreadcrumb(): React.JSX.Element {
  return (
    <OperatorPageBreadcrumb
      data-testid="identity-providers-role-mapping-breadcrumb"
      items={[
        {
          label: ROLE_MAPPING_SETTINGS_BREADCRUMB_ADMINISTRATION_LABEL,
          href: ROLE_MAPPING_SETTINGS_BREADCRUMB_ADMINISTRATION_PATH,
        },
        { label: ROLE_MAPPING_SETTINGS_BREADCRUMB_HUB_LABEL, href: ROLE_MAPPING_SETTINGS_BREADCRUMB_HUB_PATH },
        { label: ROLE_MAPPING_SETTINGS_BREADCRUMB_TOPIC_TITLE },
      ]}
    />
  );
}
