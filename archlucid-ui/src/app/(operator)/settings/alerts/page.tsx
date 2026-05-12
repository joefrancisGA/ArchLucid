import { redirect } from "next/navigation";

/** Legacy/bookmark alias: alert rules UX lives under the Alerts hub **Rules** tab. */
export default function SettingsAlertsRedirect() {
  redirect("/alerts?tab=rules");
}
