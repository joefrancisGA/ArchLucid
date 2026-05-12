"use client";

import { AdminHealthPageView } from "./AdminHealthPageView";
import { useAdminHealthPage } from "./use-admin-health-page";

/** Client root for admin health; keeps `page.tsx` as a thin server wrapper. */
export function AdminHealthPageMain() {
  const model = useAdminHealthPage();

  return <AdminHealthPageView model={model} />;
}
