import { permanentRedirect } from "next/navigation";

import { SPONSOR_REPORT_PILOT_OUTCOMES_PATH } from "@/lib/sponsor-report-navigation";

/** Legacy pilot value report URL — permanently redirects to canonical sponsor report pilot outcomes. */
export default function LegacyPilotValueReportRedirectPage(): never {
  permanentRedirect(SPONSOR_REPORT_PILOT_OUTCOMES_PATH);
}
