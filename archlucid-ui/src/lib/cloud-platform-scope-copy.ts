import { ACCOUNT_PREFERENCES_PATH } from "@/lib/account-route-paths";

/** Personal preferences card — cloud platform visibility. */
export const PREFERENCES_CLOUD_PLATFORMS_HEADING = "Cloud platforms shown";

export const PREFERENCES_CLOUD_PLATFORMS_LEAD =
  "Choose which cloud platforms appear in Integrations and connection flows. Your choices are saved to your account and sync across browsers. Hidden platforms are removed from the product until you turn them back on here.";

/** Cloud connections hub — points readers to personal preferences instead of inline toggles. */
export const CLOUD_CONNECTIONS_PLATFORM_SCOPE_PREFERENCES_NOTICE =
  "To show or hide cloud platforms, open Personal preferences.";

export const CLOUD_CONNECTIONS_PLATFORM_SCOPE_PREFERENCES_LINK_LABEL = "Personal preferences";

export const CLOUD_CONNECTIONS_PLATFORM_SCOPE_PREFERENCES_HREF =
  `${ACCOUNT_PREFERENCES_PATH}#cloud-platforms-shown` as const;

export const CLOUD_CONNECTIONS_PLATFORM_SCOPE_EMPTY_SELECTION =
  "No platforms are selected. Turn platforms back on in Personal preferences, or use";
