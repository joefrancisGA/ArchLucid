"use client";

import type { AdminUsersPageServerLoad } from "./load-admin-users-page-data";
import { AdminUsersPageView } from "./AdminUsersPageView";
import { useAdminUsersPage } from "./use-admin-users-page";

type Props = {
  readonly loaded: AdminUsersPageServerLoad;
};

export function AdminUsersPageClient(props: Props) {
  const model = useAdminUsersPage(props.loaded);

  return <AdminUsersPageView model={model} />;
}
