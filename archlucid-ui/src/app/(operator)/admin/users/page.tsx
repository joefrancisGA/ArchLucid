import { AdminUsersPageMain } from "./_sections/AdminUsersPageMain";

/**
 * Tenant user directory and rank assignment. Editing requires API routes that are not yet wired in this repo;
 * the page stays read-only until GET/PUT admin user endpoints are available.
 */
export default function AdminUsersPage() {
  return <AdminUsersPageMain />;
}
