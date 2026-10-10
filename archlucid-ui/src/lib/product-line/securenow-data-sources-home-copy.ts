import {
  GOVERNANCE_INFRASTRUCTURE_DECLARED_CONNECTIONS_PATH,
  GOVERNANCE_INFRASTRUCTURE_EXTRACT_UPLOAD_PATH,
} from "@/lib/governance/governance-infrastructure-route-paths";
import { CLOUD_CONNECTIONS_PATH } from "@/lib/integrations-nav-paths";
import type { SecureNowHomeDestinationRow } from "@/lib/product-line/securenow-home-destination-rows";

export const SECURENOW_DATA_SOURCES_HOME_ROWS: readonly SecureNowHomeDestinationRow[] = [
  {
    href: CLOUD_CONNECTIONS_PATH,
    label: "Azure connections",
    summary: "Connect the Azure tenants and subscriptions SecureNow collects from.",
    recommendedFirst: true,
  },
  {
    href: GOVERNANCE_INFRASTRUCTURE_DECLARED_CONNECTIONS_PATH,
    label: "Declared connections",
    summary: "Record connections that collection cannot see.",
  },
  {
    href: GOVERNANCE_INFRASTRUCTURE_EXTRACT_UPLOAD_PATH,
    label: "Manual upload",
    summary: "Upload a collection ZIP when live collection is not available.",
  },
];
