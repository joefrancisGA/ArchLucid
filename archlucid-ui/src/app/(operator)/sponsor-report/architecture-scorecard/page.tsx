import type { Metadata } from "next";

import { PilotScorecardPageClient } from "@/app/(operator)/scorecard/_sections/PilotScorecardPageClient";
import { loadPilotScorecardPageData } from "@/app/(operator)/scorecard/_sections/load-pilot-scorecard-page-data";
import { BUYER_TERMINOLOGY } from "@/lib/buyer-surface-vocabulary";
import { SPONSOR_REPORT_SECTION_LABEL } from "@/lib/sponsor-report-navigation";

export const metadata: Metadata = {
  title: `${BUYER_TERMINOLOGY.reviewScorecard} | ${SPONSOR_REPORT_SECTION_LABEL}`,
};

export default async function SponsorReportArchitectureScorecardPage() {
  const loaded = await loadPilotScorecardPageData();

  return <PilotScorecardPageClient loaded={loaded} />;
}
