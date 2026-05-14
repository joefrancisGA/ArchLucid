import { AdminHealthPageClient } from "./_sections/AdminHealthPageClient";
import { loadAdminHealthPageData } from "./_sections/load-admin-health-page-data";

export default async function AdminHealthPage() {
  const loaded = await loadAdminHealthPageData();

  return <AdminHealthPageClient loaded={loaded} />;
}
