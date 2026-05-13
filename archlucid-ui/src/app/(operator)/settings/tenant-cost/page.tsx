import { getTenantCostEstimate } from "@/lib/api";
import { toApiLoadFailure } from "@/lib/api-load-failure";

import { TenantCostSettingsPageView } from "./_sections/TenantCostSettingsPageView";

export default async function TenantCostSettingsPage() {
  try {
    const estimate = await getTenantCostEstimate();

    return <TenantCostSettingsPageView estimate={estimate} failure={null} />;
  } catch (e: unknown) {
    return <TenantCostSettingsPageView estimate={null} failure={toApiLoadFailure(e)} />;
  }
}
