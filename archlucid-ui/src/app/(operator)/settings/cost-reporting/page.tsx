import { CostReportingSettingsPageMain } from "./_sections/CostReportingSettingsPageMain";

/**
 * Admin-only estimated LLM usage/cost reporting: 30-day trend plus workspace/project breakdown.
 * Uses `GET /v1/tenant/llm-cost-reporting` when present; otherwise deterministic mock data for the same layout.
 */
export default function CostReportingSettingsPage() {
  return <CostReportingSettingsPageMain />;
}
