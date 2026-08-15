import type { ReactNode } from "react";
import type { Metadata } from "next";

import { ARCHITECTURE_SPONSOR_DASHBOARD_ROUTE_METADATA } from "@/lib/architecture/architecture-sponsor-dashboard-route-metadata";
import AuthorityThemePilotRouteLayout from "@/lib/next/authority-theme-pilot-route-layout";
import { OperatorClientDrivenRouteLayout } from "@/lib/next/operator-client-driven-route-layout";

export const metadata: Metadata = ARCHITECTURE_SPONSOR_DASHBOARD_ROUTE_METADATA;

export default function SponsorDashboardLayout(props: { children: ReactNode }) {
  return (
    <AuthorityThemePilotRouteLayout>
      <OperatorClientDrivenRouteLayout>{props.children}</OperatorClientDrivenRouteLayout>
    </AuthorityThemePilotRouteLayout>
  );
}
