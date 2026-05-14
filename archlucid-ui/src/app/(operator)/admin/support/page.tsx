import { AdminSupportPageClient } from "./_sections/AdminSupportPageClient";
import { loadAdminSupportPageData } from "./_sections/load-admin-support-page-data";

/**
 * Operator-facing support: one-button download of a redacted support bundle ZIP,
 * gated by `ExecuteAuthority` server-side.
 */
export default async function AdminSupportPage() {
  const loaded = await loadAdminSupportPageData();

  return <AdminSupportPageClient loaded={loaded} />;
}
