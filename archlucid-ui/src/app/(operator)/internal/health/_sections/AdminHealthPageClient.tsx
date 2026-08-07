"use client";

import type { AdminHealthPageServerLoad } from "./load-admin-health-page-data";
import { AdminHealthPageView } from "./AdminHealthPageView";
import { useAdminHealthPage } from "./use-admin-health-page";

type Props = {
  readonly loaded: AdminHealthPageServerLoad;
};

export function AdminHealthPageClient(props: Props) {
  const model = useAdminHealthPage(props.loaded);

  return <AdminHealthPageView model={model} />;
}
