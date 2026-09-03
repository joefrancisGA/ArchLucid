import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";

import {
  DIAGNOSTICS_SETTINGS_BREADCRUMB_ADMINISTRATION_LABEL,
  DIAGNOSTICS_SETTINGS_BREADCRUMB_ADMINISTRATION_PATH,
  DIAGNOSTICS_SETTINGS_BREADCRUMB_HUB_LABEL,
  DIAGNOSTICS_SETTINGS_BREADCRUMB_HUB_PATH,
  DIAGNOSTICS_SETTINGS_BREADCRUMB_TOPIC_TITLE,
} from "./diagnostics-settings-page-copy";

/** Administration trail for identity diagnostics settings (SEI). */
export function IdentityProvidersDiagnosticsBreadcrumb(): React.JSX.Element {
  return (
    <OperatorPageBreadcrumb
      data-testid="identity-providers-diagnostics-breadcrumb"
      items={[
        {
          label: DIAGNOSTICS_SETTINGS_BREADCRUMB_ADMINISTRATION_LABEL,
          href: DIAGNOSTICS_SETTINGS_BREADCRUMB_ADMINISTRATION_PATH,
        },
        { label: DIAGNOSTICS_SETTINGS_BREADCRUMB_HUB_LABEL, href: DIAGNOSTICS_SETTINGS_BREADCRUMB_HUB_PATH },
        { label: DIAGNOSTICS_SETTINGS_BREADCRUMB_TOPIC_TITLE },
      ]}
    />
  );
}
