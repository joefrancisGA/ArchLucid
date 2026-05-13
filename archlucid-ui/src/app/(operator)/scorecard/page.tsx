import { PilotScorecardPageClient } from "./_sections/PilotScorecardPageClient";
import { loadPilotScorecardPageData } from "./_sections/load-pilot-scorecard-page-data";

export default async function PilotScorecardPage() {
  const loaded = await loadPilotScorecardPageData();

  return <PilotScorecardPageClient loaded={loaded} />;
}
