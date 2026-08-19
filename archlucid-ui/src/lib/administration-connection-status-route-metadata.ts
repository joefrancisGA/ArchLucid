import type { Metadata } from "next";

import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";

/**
 * Administration Connection status hub — connector readiness dashboard (not a marketing page).
 */
export const ADMINISTRATION_CONNECTION_STATUS_ROUTE_METADATA: Metadata = {
  title: OPERATOR_NAV_LINK_LABELS.connectionStatus,
  description:
    "See which notification, ticketing, publishing, and delivery integrations are configured for this workspace and what to set up first.",
  robots: { index: false, follow: false },
};
