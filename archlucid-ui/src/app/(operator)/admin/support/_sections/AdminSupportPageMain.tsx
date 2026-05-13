"use client";

import { AdminSupportPageView } from "./AdminSupportPageView";
import { useAdminSupportPage } from "./use-admin-support-page";

export function AdminSupportPageMain() {
  const model = useAdminSupportPage();

  return <AdminSupportPageView model={model} />;
}
