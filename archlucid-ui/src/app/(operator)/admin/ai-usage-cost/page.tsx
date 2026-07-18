import { CostReportingSettingsPageClient } from "@/app/(operator)/settings/ai-usage/_sections/CostReportingSettingsPageClient";
import { loadCostReportingSettingsPageData } from "@/app/(operator)/settings/ai-usage/_sections/load-cost-reporting-settings-page-data";

/**
 * System-administration page for AI usage and cost: estimated LLM spend, token usage,
 * monthly budget status, and processing queue health.
 *
 * Reuses the cost-reporting data layer; the visual surface is in CostReportingSettingsPageView.
 */
export default async function AiUsageAndCostPage() {
  const loaded = await loadCostReportingSettingsPageData();

  return <CostReportingSettingsPageClient loaded={loaded} />;
}
