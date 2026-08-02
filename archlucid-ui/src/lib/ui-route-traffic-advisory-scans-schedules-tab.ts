import { ADVISORY_SCANS_SCHEDULES_HREF } from "@/lib/advisory-scans-route";

/**
 * Traffic workbook row ID for Advisory scans Schedules tab.
 * Owner backlog shorthand: AD.
 */
export const ADVISORY_SCANS_SCHEDULES_TAB_TRAFFIC_ROW_ID = "AD";

/** Canonical path tracked on the AD workbook row. */
export const ADVISORY_SCANS_SCHEDULES_TAB_TRAFFIC_PATH = ADVISORY_SCANS_SCHEDULES_HREF;

/** Workbook Section column value — query-tab deep link on a governance hub. */
export const ADVISORY_SCANS_SCHEDULES_TAB_TRAFFIC_SECTION = "Tab surface";

/**
 * Owner workbook Notes for AD — documents the Schedules tab on the Advisory scans hub.
 */
export const ADVISORY_SCANS_SCHEDULES_TAB_TRAFFIC_NOTE =
  "Advisory scans Schedules tab (left nav Governance → Advisory scans → Schedules). AdvisorySchedulesContent + AdvisoryScheduleCreateForm; digest send-test and setup-gap handoffs. Legacy /advisory-scheduling redirects via TB-1124. Sibling ADS row = default Scans tab.";
