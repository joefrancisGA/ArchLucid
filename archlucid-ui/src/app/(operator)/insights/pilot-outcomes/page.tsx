import { redirect } from "next/navigation";

import { SPONSOR_REPORT_PATH } from "@/lib/sponsor-report-navigation";

/** Retired route — pilot outcomes content lives on the merged sponsor report page. */
export default function RetiredPilotOutcomesRedirect(): void {
  redirect(SPONSOR_REPORT_PATH);
}
