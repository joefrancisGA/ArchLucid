import type { ReactNode } from "react";

import { TenantMigrationMaintenanceBanner } from "@/components/tenancy/TenantMigrationMaintenanceBanner";
import { OperatorDataRouteLayout } from "@/lib/next/operator-data-route-layout";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default function ValueReportLayout({ children }: { children: ReactNode }) {
  return (
    <OperatorDataRouteLayout>
      <TenantMigrationMaintenanceBanner />
      {children}
    </OperatorDataRouteLayout>
  );
}
