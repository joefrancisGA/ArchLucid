import {
  GOVERNANCE_INFRASTRUCTURE_DECLARED_CONNECTIONS_PATH,
  GOVERNANCE_INFRASTRUCTURE_EXTRACT_UPLOAD_PATH,
  SECURENOW_INFRASTRUCTURE_DECLARED_CONNECTIONS_PATH,
  SECURENOW_INFRASTRUCTURE_EXTRACT_UPLOAD_PATH,
} from "@/lib/governance/governance-infrastructure-route-paths";
import { CLOUD_CONNECTIONS_PATH } from "@/lib/integrations-nav-paths";
import type { SecureNowHomeDestinationRow } from "@/lib/product-line/securenow-home-destination-rows";
import { SECURENOW_NAV_LABELS } from "@/lib/product-line/securenow-nav-labels";

export const SECURENOW_DATA_SOURCES_HOME_ROWS: readonly SecureNowHomeDestinationRow[] = [
  {
    href: CLOUD_CONNECTIONS_PATH,
    label: SECURENOW_NAV_LABELS[CLOUD_CONNECTIONS_PATH],
    summary: "Connect the Azure tenants and subscriptions SecureNow collects from.",
    recommendedFirst: true,
  },
  {
    href: GOVERNANCE_INFRASTRUCTURE_DECLARED_CONNECTIONS_PATH,
    label: SECURENOW_NAV_LABELS[SECURENOW_INFRASTRUCTURE_DECLARED_CONNECTIONS_PATH],
    summary: "Record connections that collection cannot see.",
  },
  {
    href: GOVERNANCE_INFRASTRUCTURE_EXTRACT_UPLOAD_PATH,
    label: SECURENOW_NAV_LABELS[SECURENOW_INFRASTRUCTURE_EXTRACT_UPLOAD_PATH],
    summary: "Upload a collection ZIP when live collection is not available.",
  },
];
