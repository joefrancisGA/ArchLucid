import { AdminUsersPageClient } from "./_sections/AdminUsersPageClient";
import { loadAdminUsersPageData } from "./_sections/load-admin-users-page-data";

/**
 * Tenant user directory and rank assignment. Editing requires API routes that are not yet wired in this repo;
 * the page stays read-only until GET/PUT admin user endpoints are available.
 */
export default async function AdminUsersPage() {
  const loaded = await loadAdminUsersPageData();

  return <AdminUsersPageClient loaded={loaded} />;
}
