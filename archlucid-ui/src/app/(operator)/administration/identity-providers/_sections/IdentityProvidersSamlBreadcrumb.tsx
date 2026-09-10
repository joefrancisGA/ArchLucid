import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";

import {
  SAML_SETTINGS_BREADCRUMB_ADMINISTRATION_LABEL,
  SAML_SETTINGS_BREADCRUMB_ADMINISTRATION_PATH,
  SAML_SETTINGS_BREADCRUMB_HUB_LABEL,
  SAML_SETTINGS_BREADCRUMB_HUB_PATH,
  SAML_SETTINGS_BREADCRUMB_TOPIC_TITLE,
} from "./saml-settings-page-copy";

/** Administration trail for SAML configuration settings (ASA). */
export function IdentityProvidersSamlBreadcrumb(): React.JSX.Element {
  return (
    <OperatorPageBreadcrumb
      data-testid="identity-providers-saml-breadcrumb"
      items={[
        {
          label: SAML_SETTINGS_BREADCRUMB_ADMINISTRATION_LABEL,
          href: SAML_SETTINGS_BREADCRUMB_ADMINISTRATION_PATH,
        },
        { label: SAML_SETTINGS_BREADCRUMB_HUB_LABEL, href: SAML_SETTINGS_BREADCRUMB_HUB_PATH },
        { label: SAML_SETTINGS_BREADCRUMB_TOPIC_TITLE },
      ]}
    />
  );
}
