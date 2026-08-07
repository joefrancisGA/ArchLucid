import { redirect } from "next/navigation";

import { EXECUTIVE_SCORECARD_REDIRECT_HREF } from "@/lib/executive-scorecard-route";

/**
 * Legacy bookmark shim — sponsor scorecard KPIs live on the executive dashboard.
 */
export default function ExecutiveScorecardPage() {
  redirect(EXECUTIVE_SCORECARD_REDIRECT_HREF);
}
