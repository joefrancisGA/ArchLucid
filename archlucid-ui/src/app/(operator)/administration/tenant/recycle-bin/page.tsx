import { redirect } from "next/navigation";

import { SETTINGS_WORKSPACE_SETTINGS_RECYCLE_BIN_PATH } from "@/lib/settings-admin-route-paths";

/** Legacy bookmark — canonical projects recycle bin lives under {@link SETTINGS_WORKSPACE_SETTINGS_RECYCLE_BIN_PATH}. */
export default function LegacyTenantRecycleBinRedirectPage() {
  redirect(SETTINGS_WORKSPACE_SETTINGS_RECYCLE_BIN_PATH);
}
