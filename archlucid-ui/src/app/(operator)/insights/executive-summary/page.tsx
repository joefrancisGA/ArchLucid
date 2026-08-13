import type { Metadata } from "next";

import { PilotValueReportPageClient } from "@/app/(operator)/insights/executive-summary/_sections/PilotValueReportPageClient";
import { loadPilotValueReportPageData } from "@/app/(operator)/insights/executive-summary/_sections/load-pilot-value-report-page-data";
import {
  SPONSOR_REPORT_PAGE_SUBTITLE,
  SPONSOR_REPORT_PAGE_TITLE,
  SPONSOR_REPORT_SECTION_LABEL,
} from "@/lib/sponsor-report-navigation";

export const metadata: Metadata = {
  title: `${SPONSOR_REPORT_PAGE_TITLE} | ${SPONSOR_REPORT_SECTION_LABEL}`,
  description: SPONSOR_REPORT_PAGE_SUBTITLE,
};

export default async function SponsorReportPage() {
  const loaded = await loadPilotValueReportPageData();

  return <PilotValueReportPageClient loaded={loaded} />;
}
