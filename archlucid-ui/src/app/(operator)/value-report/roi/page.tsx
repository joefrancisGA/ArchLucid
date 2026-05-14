import { RoiSummaryPageClient } from "./_sections/RoiSummaryPageClient";
import { loadRoiSummaryPageData } from "./_sections/load-roi-summary-page-data";

export default async function RoiSummaryPage() {
  const loaded = await loadRoiSummaryPageData();

  return <RoiSummaryPageClient loaded={loaded} />;
}
