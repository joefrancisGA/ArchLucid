import type { Metadata } from "next";

import { ValueReportPageClient } from "@/app/(operator)/value-report/_sections/ValueReportPageClient";
import { loadValueReportPageData } from "@/app/(operator)/value-report/_sections/load-value-report-page-data";
import { SPONSOR_REPORT_SECTION_LABEL } from "@/lib/sponsor-report-navigation";

export const metadata: Metadata = {
  title: `Executive summary | ${SPONSOR_REPORT_SECTION_LABEL}`,
};

export default async function SponsorReportExecutiveSummaryPage() {
  const loaded = await loadValueReportPageData();

  return <ValueReportPageClient loaded={loaded} />;
}
