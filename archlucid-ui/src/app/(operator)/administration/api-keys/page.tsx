import { redirect } from "next/navigation";

import { isApiKeysSettingsSurfaceEnabled } from "@/lib/api-keys-settings-access";

import { ApiKeysSettingsPageClient } from "./_sections/ApiKeysSettingsPageClient";

/** Admin-only host API key status and rotation material (Key Vault / app settings deployment). */
export default function ApiKeysSettingsPage() {
  if (!isApiKeysSettingsSurfaceEnabled()) {
    redirect("/administration/users");
  }

  return <ApiKeysSettingsPageClient />;
}
