import {
  SECURENOW_INFRASTRUCTURE_DECLARED_CONNECTIONS_PATH,
  SECURENOW_INFRASTRUCTURE_EXTRACT_UPLOAD_PATH,
} from "@/lib/governance/governance-infrastructure-route-paths";
import {
  ADMINISTRATION_CONNECTION_STATUS_PATH,
  CLOUD_CONNECTIONS_PATH,
} from "@/lib/integrations-nav-paths";
import type { SecureNowHomeDestinationRow } from "@/lib/product-line/securenow-home-destination-rows";
import { SECURENOW_COLLECTION_AGENT_PATH } from "@/lib/product-line/securenow-collection-agent-route";
import { SECURENOW_NAV_LABELS } from "@/lib/product-line/securenow-nav-labels";

export const SECURENOW_DATA_SOURCES_HOME_ROWS: readonly SecureNowHomeDestinationRow[] = [
  {
    href: CLOUD_CONNECTIONS_PATH,
    label: SECURENOW_NAV_LABELS[CLOUD_CONNECTIONS_PATH],
    summary: "Connect the Azure tenants and subscriptions SecureNow collects from.",
    recommendedFirst: true,
  },
  {
    href: SECURENOW_COLLECTION_AGENT_PATH,
    label: SECURENOW_NAV_LABELS[SECURENOW_COLLECTION_AGENT_PATH],
    summary: "Whether scheduled collection is running and what it found.",
  },
  {
    href: SECURENOW_INFRASTRUCTURE_DECLARED_CONNECTIONS_PATH,
    label: SECURENOW_NAV_LABELS[SECURENOW_INFRASTRUCTURE_DECLARED_CONNECTIONS_PATH],
    summary: "Record connections that collection cannot see.",
  },
  {
    href: ADMINISTRATION_CONNECTION_STATUS_PATH,
    label: SECURENOW_NAV_LABELS[ADMINISTRATION_CONNECTION_STATUS_PATH],
    summary: "Health of collection and integrations.",
  },
  {
    href: SECURENOW_INFRASTRUCTURE_EXTRACT_UPLOAD_PATH,
    label: SECURENOW_NAV_LABELS[SECURENOW_INFRASTRUCTURE_EXTRACT_UPLOAD_PATH],
    summary: "Upload a collection ZIP when live collection is not available.",
  },
];
