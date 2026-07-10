import { redirect } from "next/navigation";

import { GOVERNANCE_ALERT_RULES_PATH } from "@/lib/governance-route-paths";

/** Legacy settings bookmark — alert rules moved to `/governance/alert-rules`. */
export default function SettingsAlertsRedirectPage() {
  redirect(GOVERNANCE_ALERT_RULES_PATH);
}
