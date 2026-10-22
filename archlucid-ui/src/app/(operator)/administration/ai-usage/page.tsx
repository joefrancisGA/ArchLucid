import { CostReportingSettingsPageClient } from "./_sections/CostReportingSettingsPageClient";
import { loadCostReportingSettingsPageData } from "./_sections/load-cost-reporting-settings-page-data";

/**
 * Admin-only estimated LLM usage/cost reporting: 30-day trend plus workspace/project breakdown.
 * Uses `GET /v1/tenant/llm-cost-reporting` when present; otherwise deterministic mock data for the same layout.
 */
export default async function CostReportingSettingsPage() {
  const loaded = await loadCostReportingSettingsPageData();

  return <CostReportingSettingsPageClient loaded={loaded} />;
}
