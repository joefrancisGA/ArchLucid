import { TenantSettingsPageClient } from "./_sections/TenantSettingsPageClient";
import { loadTenantSettingsPageData } from "./_sections/load-tenant-settings-page-data";

export default async function TenantSettingsPage() {
  const loaded = await loadTenantSettingsPageData();

  if (loaded.mode === "hidden") {
    return null;
  }

  return <TenantSettingsPageClient loaded={loaded} />;
}
