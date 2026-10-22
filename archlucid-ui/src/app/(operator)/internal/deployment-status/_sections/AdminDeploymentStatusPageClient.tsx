"use client";

import { AdminDeploymentStatusPageView } from "./AdminDeploymentStatusPageView";
import type { AdminDeploymentStatusPageServerLoad } from "./load-admin-deployment-status-page-data";
import { useAdminDeploymentStatusPage } from "./use-admin-deployment-status-page";

type Props = {
  readonly loaded: AdminDeploymentStatusPageServerLoad;
};

export function AdminDeploymentStatusPageClient(props: Props) {
  const model = useAdminDeploymentStatusPage(props.loaded);

  return <AdminDeploymentStatusPageView model={model} />;
}
