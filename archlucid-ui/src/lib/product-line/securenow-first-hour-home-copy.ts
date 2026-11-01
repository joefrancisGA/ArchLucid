import type { SecureNowHomeDestinationRow } from "@/lib/product-line/securenow-home-destination-rows";

export const SECURENOW_FIRST_HOUR_HOME_SECTION_HEADING = "Start here" as const;

export const SECURENOW_FIRST_HOUR_HOME_SECTION_LEAD =
  "Four steps before verification or sponsor packaging. This is not a timed SLA. SecureNow beta remains NO_GO." as const;

export const SECURENOW_FIRST_HOUR_OPERATOR_PATH = "/administration/securenow-first-hour" as const;

export const SECURENOW_FIRST_HOUR_HOME_ROWS: readonly SecureNowHomeDestinationRow[] = [
  {
    href: SECURENOW_FIRST_HOUR_OPERATOR_PATH,
    label: "First hour path",
    summary: "Confirm scope, open one ranked path, read the cut point, then stop.",
    recommendedFirst: true,
  },
];
