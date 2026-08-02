import type { Metadata } from "next";
import type { ReactNode } from "react";

import { ARCHITECTURE_EXECUTIVE_DASHBOARD_ROUTE_METADATA } from "@/lib/architecture-executive-dashboard-route-metadata";

export const metadata: Metadata = ARCHITECTURE_EXECUTIVE_DASHBOARD_ROUTE_METADATA;
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return children;
}
