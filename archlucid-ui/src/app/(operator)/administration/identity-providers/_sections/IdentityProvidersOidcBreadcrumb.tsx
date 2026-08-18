import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";

import {
  OIDC_SETTINGS_BREADCRUMB_ADMINISTRATION_LABEL,
  OIDC_SETTINGS_BREADCRUMB_ADMINISTRATION_PATH,
  OIDC_SETTINGS_BREADCRUMB_HUB_LABEL,
  OIDC_SETTINGS_BREADCRUMB_HUB_PATH,
  OIDC_SETTINGS_BREADCRUMB_TOPIC_TITLE,
} from "./oidc-settings-page-copy";

/** Administration trail for OIDC/JWT settings (AOI). */
export function IdentityProvidersOidcBreadcrumb(): React.JSX.Element {
  return (
    <OperatorPageBreadcrumb
      data-testid="identity-providers-oidc-breadcrumb"
      items={[
        {
          label: OIDC_SETTINGS_BREADCRUMB_ADMINISTRATION_LABEL,
          href: OIDC_SETTINGS_BREADCRUMB_ADMINISTRATION_PATH,
        },
        { label: OIDC_SETTINGS_BREADCRUMB_HUB_LABEL, href: OIDC_SETTINGS_BREADCRUMB_HUB_PATH },
        { label: OIDC_SETTINGS_BREADCRUMB_TOPIC_TITLE },
      ]}
    />
  );
}
