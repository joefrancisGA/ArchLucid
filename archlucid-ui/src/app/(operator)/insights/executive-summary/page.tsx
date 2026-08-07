import type { Metadata } from "next";

import { ValueReportPageClient } from "@/app/(operator)/insights/executive-summary/_sections/ValueReportPageClient";
import { loadValueReportPageData } from "@/app/(operator)/insights/executive-summary/_sections/load-value-report-page-data";
import {
  EXECUTIVE_SUMMARY_PAGE_TITLE,
  SPONSOR_REPORT_SECTION_LABEL,
} from "@/lib/sponsor-report-navigation";

export const metadata: Metadata = {
  title: `${EXECUTIVE_SUMMARY_PAGE_TITLE} | ${SPONSOR_REPORT_SECTION_LABEL}`,
};

export default async function SponsorReportExecutiveSummaryPage() {
  const loaded = await loadValueReportPageData();

  return <ValueReportPageClient loaded={loaded} />;
}
