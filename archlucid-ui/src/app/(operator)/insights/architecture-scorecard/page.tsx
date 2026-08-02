import type { Metadata } from "next";

import { PilotScorecardPageClient } from "@/app/(operator)/insights/architecture-scorecard/_sections/PilotScorecardPageClient";
import { loadPilotScorecardPageData } from "@/app/(operator)/insights/architecture-scorecard/_sections/load-pilot-scorecard-page-data";
import { BUYER_TERMINOLOGY } from "@/lib/buyer-surface-vocabulary";

export const metadata: Metadata = {
  title: BUYER_TERMINOLOGY.reviewScorecard,
};

/** Architecture scorecard (`/insights/architecture-scorecard`). */
export default async function ArchitectureScorecardPage() {
  const loaded = await loadPilotScorecardPageData();

  return <PilotScorecardPageClient loaded={loaded} />;
}
