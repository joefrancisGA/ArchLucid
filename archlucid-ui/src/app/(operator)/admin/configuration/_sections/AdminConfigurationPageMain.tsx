"use client";

import { AdminConfigurationPageView } from "./AdminConfigurationPageView";
import { useAdminConfigurationPage } from "./use-admin-configuration-page";

/** Client entry for admin configuration; `page.tsx` stays a thin server wrapper. */
export function AdminConfigurationPageMain() {
  const model = useAdminConfigurationPage();

  return <AdminConfigurationPageView model={model} />;
}
