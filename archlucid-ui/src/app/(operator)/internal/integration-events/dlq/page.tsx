import { permanentRedirect } from "next/navigation";

import { INTERNAL_INTEGRATION_EVENTS_DLQ_PATH } from "@/lib/internal-ops-route-paths";

/** Retired IA path — canonical surface is `/internal/failed-integration-messages`. */
export default function LegacyInternalIntegrationEventsDlqPage(): never {
  permanentRedirect(INTERNAL_INTEGRATION_EVENTS_DLQ_PATH);
}
