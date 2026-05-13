"use client";

import { AdminUsersPageView } from "./AdminUsersPageView";
import { useAdminUsersPage } from "./use-admin-users-page";

export function AdminUsersPageMain() {
  const model = useAdminUsersPage();

  return <AdminUsersPageView model={model} />;
}
