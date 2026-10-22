import type { Metadata } from "next";

import { RoiSummaryPageClient } from "@/app/(operator)/insights/roi-summary/_sections/RoiSummaryPageClient";
import { loadRoiSummaryPageData } from "@/app/(operator)/insights/roi-summary/_sections/load-roi-summary-page-data";
import { SPONSOR_REPORT_SECTION_LABEL } from "@/lib/sponsor-report-navigation";

export const metadata: Metadata = {
  title: `ROI summary | ${SPONSOR_REPORT_SECTION_LABEL}`,
};

export default async function SponsorReportRoiSummaryPage() {
  const loaded = await loadRoiSummaryPageData();

  return <RoiSummaryPageClient loaded={loaded} />;
}
