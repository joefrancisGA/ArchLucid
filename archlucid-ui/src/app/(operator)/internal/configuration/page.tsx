import { AdminConfigurationPageClient } from "./_sections/AdminConfigurationPageClient";
import { loadAdminConfigurationPageData } from "./_sections/load-admin-configuration-page-data";

export default async function AdminConfigurationPage() {
  const loaded = await loadAdminConfigurationPageData();

  return <AdminConfigurationPageClient loaded={loaded} />;
}
