import { PilotValueReportPageClient } from "./_sections/PilotValueReportPageClient";
import { loadPilotValueReportPageData } from "./_sections/load-pilot-value-report-page-data";

export default async function PilotValueReportPage() {
  const loaded = await loadPilotValueReportPageData();

  return <PilotValueReportPageClient loaded={loaded} />;
}
