import { PlanningPlanDetailPageClient } from "./_sections/PlanningPlanDetailPageClient";
import { loadPlanningPlanDetailPageData } from "./_sections/load-planning-plan-detail-page-data";

/**
 * Single improvement plan detail: steps, priority, and evidence link counts (59R).
 */
export default async function PlanningPlanDetailPage({ params }: { params: Promise<{ planId: string }> }) {
  const { planId } = await params;
  const loaded = await loadPlanningPlanDetailPageData(planId);

  return <PlanningPlanDetailPageClient loaded={loaded} />;
}
