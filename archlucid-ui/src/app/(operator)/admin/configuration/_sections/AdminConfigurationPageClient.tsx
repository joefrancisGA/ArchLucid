"use client";

import type { AdminConfigurationPageServerLoad } from "./load-admin-configuration-page-data";
import { AdminConfigurationPageView } from "./AdminConfigurationPageView";
import { useAdminConfigurationPage } from "./use-admin-configuration-page";

type Props = {
  readonly loaded: AdminConfigurationPageServerLoad;
};

export function AdminConfigurationPageClient(props: Props) {
  const model = useAdminConfigurationPage(props.loaded);

  return <AdminConfigurationPageView model={model} />;
}
