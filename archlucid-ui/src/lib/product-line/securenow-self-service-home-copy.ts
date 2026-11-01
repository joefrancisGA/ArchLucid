import type { SecureNowHomeDestinationRow } from "@/lib/product-line/securenow-home-destination-rows";

export const SECURENOW_SELF_SERVICE_HOME_SECTION_HEADING = "When you are stuck" as const;

export const SECURENOW_SELF_SERVICE_HOME_SECTION_LEAD =
  "Four checks before you email. This is not a support SLA. SecureNow beta remains NO_GO." as const;

export const SECURENOW_SELF_SERVICE_OPERATOR_PATH = "/administration/securenow-self-service" as const;

export const SECURENOW_SELF_SERVICE_HOME_ROWS: readonly SecureNowHomeDestinationRow[] = [
  {
    href: SECURENOW_SELF_SERVICE_OPERATOR_PATH,
    label: "Stuck-state checks",
    summary: "Collection, connector status, not verified, then email support@archlucid.net.",
  },
];
