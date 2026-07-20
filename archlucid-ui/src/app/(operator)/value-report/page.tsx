import { permanentRedirect } from "next/navigation";

import { SPONSOR_REPORT_EXECUTIVE_SUMMARY_PATH } from "@/lib/sponsor-report-navigation";

/** Legacy value report hub — permanently redirects to canonical sponsor report executive summary. */
export default function LegacyValueReportRedirectPage(): never {
  permanentRedirect(SPONSOR_REPORT_EXECUTIVE_SUMMARY_PATH);
}
