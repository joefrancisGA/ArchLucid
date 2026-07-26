import { redirect } from "next/navigation";

import { ADVISORY_SCANS_SCHEDULES_HREF } from "@/lib/advisory-scans-route";

/**
 * Legacy route: advisory scan schedules live on the Advisory scans hub Schedules tab (TB-1124).
 */
export default function AdvisorySchedulingRedirect() {
  redirect(ADVISORY_SCANS_SCHEDULES_HREF);
}
