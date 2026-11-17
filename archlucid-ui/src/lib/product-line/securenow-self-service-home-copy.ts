import type { SecureNowHomeDestinationRow } from "@/lib/product-line/securenow-home-destination-rows";

export const SECURENOW_SELF_SERVICE_HOME_SECTION_HEADING = "When you are stuck" as const;

export const SECURENOW_SELF_SERVICE_HOME_SECTION_LEAD =
  "Four checks before you email. This is not a support SLA. SecureNow beta remains NO_GO." as const;

export const SECURENOW_SELF_SERVICE_OPERATOR_PATH = "/administration/securenow-self-service" as const;

export const SECURENOW_COLLECTION_SELF_SERVICE_CHECK_HREF =
  `${SECURENOW_SELF_SERVICE_OPERATOR_PATH}#collection` as const;

export const SECURENOW_SELF_SERVICE_HOME_ROWS: readonly SecureNowHomeDestinationRow[] = [
  {
    href: `${SECURENOW_SELF_SERVICE_OPERATOR_PATH}#collection`,
    label: "Collection missing or stale",
    summary: "A gap is not a clean bill of health.",
  },
  {
    href: `${SECURENOW_SELF_SERVICE_OPERATOR_PATH}#connector`,
    label: "Connector will not finish",
    summary: "A failed connector is not a completed capture.",
  },
  {
    href: `${SECURENOW_SELF_SERVICE_OPERATOR_PATH}#ranking`,
    label: "No ranked path, or not verified",
    summary: "An empty ranking is not proof you are secure.",
  },
  {
    href: `${SECURENOW_SELF_SERVICE_OPERATOR_PATH}#email`,
    label: "Still stuck",
    summary: "Email support@archlucid.net with subject SecureNow. Do not paste secrets.",
  },
];
