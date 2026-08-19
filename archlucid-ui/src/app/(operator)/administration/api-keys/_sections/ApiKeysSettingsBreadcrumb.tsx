import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";

import {
  API_KEYS_SETTINGS_BREADCRUMB_ADMINISTRATION_LABEL,
  API_KEYS_SETTINGS_BREADCRUMB_ADMINISTRATION_PATH,
  API_KEYS_SETTINGS_BREADCRUMB_TOPIC_TITLE,
} from "./api-keys-settings-page-copy";

/** Administration trail for the API keys settings workspace (ADP). */
export function ApiKeysSettingsBreadcrumb(): React.JSX.Element {
  return (
    <OperatorPageBreadcrumb
      data-testid="api-keys-settings-page-breadcrumb"
      items={[
        {
          label: API_KEYS_SETTINGS_BREADCRUMB_ADMINISTRATION_LABEL,
          href: API_KEYS_SETTINGS_BREADCRUMB_ADMINISTRATION_PATH,
        },
        { label: API_KEYS_SETTINGS_BREADCRUMB_TOPIC_TITLE },
      ]}
    />
  );
}
