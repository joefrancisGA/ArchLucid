import { resolveFirstWeekRouteGuidanceForShell } from "@/lib/first-week-route-guidance";
import { SYSTEM_NOT_JOB_DESK_IN_FLIGHT_BACKGROUND_WAIT_HELPER } from "@/lib/system-not-job-in-flight-review-on-desk";

/** DW-003 — Working chrome never tells architects to stay on this page until finalize. */
export const DAYTIME_WAIT_NEVER_STAY_ON_PAGE_WORKING_OWNER = "DW-003" as const;

export const DAYTIME_WAIT_WORKING_BACKGROUND_WAIT_HELPER =
  SYSTEM_NOT_JOB_DESK_IN_FLIGHT_BACKGROUND_WAIT_HELPER;

export function resolveDaytimeWaitWorkingInProgressBridgeCopy(): string {
  return resolveFirstWeekRouteGuidanceForShell("review-detail-in-progress", {
    evalChrome: false,
  }).bridgeCopy;
}
