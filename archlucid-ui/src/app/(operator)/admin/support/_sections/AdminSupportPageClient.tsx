"use client";

import type { AdminSupportPageServerLoad } from "./load-admin-support-page-data";
import { AdminSupportPageView } from "./AdminSupportPageView";
import { useAdminSupportPage } from "./use-admin-support-page";

type Props = {
  readonly loaded: AdminSupportPageServerLoad;
};

export function AdminSupportPageClient(props: Props) {
  const model = useAdminSupportPage(props.loaded);

  return <AdminSupportPageView model={model} />;
}
