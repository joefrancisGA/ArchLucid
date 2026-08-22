import { ACCOUNT_PREFERENCES_PATH } from "@/lib/account-route-paths";

/** Personal preferences card — cloud platform visibility. */
export const PREFERENCES_CLOUD_PLATFORMS_HEADING = "Cloud platforms shown";

export const PREFERENCES_CLOUD_PLATFORMS_SCOPE_TAG = "Only affects your view";

export const PREFERENCES_CLOUD_PLATFORMS_LEAD =
  "Choose which cloud platforms appear in your Integrations and connection flows. Hidden platforms are removed from your view until you turn them back on here. Your choices are saved to your account and sync across browsers.";

export const PREFERENCES_CLOUD_PLATFORMS_EMPTY_SELECTION_MESSAGE =
  "Keep at least one cloud platform visible so Integrations and connection flows stay reachable.";

export const PREFERENCES_CLOUD_PLATFORMS_SHOW_ALL_LABEL = "Show all platforms";

/** Cloud connections hub — points readers to personal preferences instead of inline toggles. */
export const CLOUD_CONNECTIONS_PLATFORM_SCOPE_PREFERENCES_NOTICE_PREFIX =
  "To show or hide cloud platforms, open";

export const CLOUD_CONNECTIONS_PLATFORM_SCOPE_PREFERENCES_LINK_LABEL = "Personal preferences";

export const CLOUD_CONNECTIONS_PLATFORM_SCOPE_PREFERENCES_HREF =
  `${ACCOUNT_PREFERENCES_PATH}#cloud-platforms-shown` as const;

export const CLOUD_CONNECTIONS_PLATFORM_SCOPE_EMPTY_SELECTION_LEAD =
  "No platforms are selected. Turn platforms back on in";

export const CLOUD_CONNECTIONS_PLATFORM_SCOPE_EMPTY_SELECTION_MID = ", or use";

export const CLOUD_CONNECTIONS_PLATFORM_SCOPE_EMPTY_SELECTION_REVIEW_LINK_LABEL =
  "evidence-only review";
