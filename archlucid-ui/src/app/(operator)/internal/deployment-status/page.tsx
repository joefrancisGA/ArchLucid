import { AdminDeploymentStatusPageClient } from "./_sections/AdminDeploymentStatusPageClient";
import { loadAdminDeploymentStatusPageData } from "./_sections/load-admin-deployment-status-page-data";

export default async function AdminDeploymentStatusPage() {
  const loaded = await loadAdminDeploymentStatusPageData();

  return <AdminDeploymentStatusPageClient loaded={loaded} />;
}
