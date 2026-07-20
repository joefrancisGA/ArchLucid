import { permanentRedirect } from "next/navigation";

import { SPONSOR_REPORT_ARCHITECTURE_SCORECARD_PATH } from "@/lib/sponsor-report-navigation";

/** Legacy architecture scorecard URL — permanently redirects to canonical sponsor report scorecard. */
export default function LegacyArchitectureScorecardRedirectPage(): never {
  permanentRedirect(SPONSOR_REPORT_ARCHITECTURE_SCORECARD_PATH);
}
