import { permanentRedirect } from "next/navigation";

import { SPONSOR_REPORT_ROI_SUMMARY_PATH } from "@/lib/sponsor-report-navigation";

/** Legacy ROI summary URL — permanently redirects to canonical sponsor report ROI summary. */
export default function LegacyRoiSummaryRedirectPage(): never {
  permanentRedirect(SPONSOR_REPORT_ROI_SUMMARY_PATH);
}
