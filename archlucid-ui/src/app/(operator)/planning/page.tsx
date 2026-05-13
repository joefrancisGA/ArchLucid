import { PlanningPageClient } from "./_sections/PlanningPageClient";
import { loadPlanningPageData } from "./_sections/load-planning-page-data";

/**
 * 59R planning list: top themes, prioritized plans, and evidence-style counts (read-only browsing).
 */
export default async function PlanningPage() {
  const loaded = await loadPlanningPageData();

  return <PlanningPageClient loaded={loaded} />;
}
