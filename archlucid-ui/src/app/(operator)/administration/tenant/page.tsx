import { redirect } from "next/navigation";

import { SETTINGS_WORKSPACE_SETTINGS_PATH } from "@/lib/settings-admin-route-paths";

/** Legacy bookmark — canonical workspace settings live under {@link SETTINGS_WORKSPACE_SETTINGS_PATH}. */
export default function LegacyTenantSettingsRedirectPage() {
  redirect(SETTINGS_WORKSPACE_SETTINGS_PATH);
}
