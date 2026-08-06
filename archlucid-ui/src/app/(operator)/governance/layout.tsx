import type { ReactNode } from "react";

import { TenantMigrationMaintenanceBanner } from "@/components/tenancy/TenantMigrationMaintenanceBanner";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default function GovernanceLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <TenantMigrationMaintenanceBanner />
      {children}
    </>
  );
}
