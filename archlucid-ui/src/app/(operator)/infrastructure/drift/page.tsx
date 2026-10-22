import { redirect } from "next/navigation";

import { SECURENOW_INFRASTRUCTURE_DRIFT_PATH } from "@/lib/governance/governance-infrastructure-route-paths";

/** Preserve the previous SecureNow URL while the canonical route reflects the page name. */
export default function SecureNowInfrastructureDriftLegacyPage() {
  redirect(SECURENOW_INFRASTRUCTURE_DRIFT_PATH);
}
