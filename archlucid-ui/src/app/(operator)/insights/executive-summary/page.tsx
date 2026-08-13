import type { Metadata } from "next";

import { PilotValueReportPageClient } from "@/app/(operator)/insights/executive-summary/_sections/PilotValueReportPageClient";
import { loadPilotValueReportPageData } from "@/app/(operator)/insights/executive-summary/_sections/load-pilot-value-report-page-data";
import {
  EXECUTIVE_SUMMARY_PAGE_TITLE,
  SPONSOR_REPORT_SECTION_LABEL,
} from "@/lib/sponsor-report-navigation";

export const metadata: Metadata = {
  title: `${EXECUTIVE_SUMMARY_PAGE_TITLE} | ${SPONSOR_REPORT_SECTION_LABEL}`,
};

export default async function SponsorReportExecutiveSummaryPage() {
  const loaded = await loadPilotValueReportPageData();

  return <PilotValueReportPageClient loaded={loaded} />;
}
