/**
 * Traffic workbook row ID for Architecture digests.
 * Owner backlog shorthand: ARD (template formerly DI).
 */

import { DIGESTS_HUB_PATH } from "@/lib/digests-route-paths";

export const DIGESTS_TRAFFIC_ROW_ID = "ARD";

/** Canonical path tracked on the ARD workbook row. */
export const DIGESTS_TRAFFIC_PATH = DIGESTS_HUB_PATH;

/** Workbook Section column value. */
export const DIGESTS_TRAFFIC_SECTION = "Digests";

/**
 * Owner workbook Notes for ARD - documents Evidence chrome on Architecture digests.
 */
export const DIGESTS_TRAFFIC_NOTE =
  "Architecture digests - DigestsHubClient with DigestsPageHeader PageContextualHelp (topic map digests / Architecture digests; Category-1 registry + Schedule deep links; trigger text reads Help so the header does not echo its own title), tab bar directly under the header, one primary header action (next unresolved setup step, or Preview latest generated digest once configured), Sources follow-up strip below the tabs with no claim-boundary band (owner decision 2026-08-05), WeeklyDigestHealthBanner reduced to a status strip on every tab (status tag + tab-relevant facts only) so each tab tells the setup story exactly once - Browse via DigestsBrowseSetupChecklist, Subscriptions via DigestSubscriptionsReadinessPanel, Schedule via its own readiness rail. One status vocabulary across tabs (Setup incomplete / Action needed / Ready). Learn more â†’ /help/digests (HDG). Not a signed-record Sources trail. Score 71/100 (2026-08-05) after TB-1480 / TB-1501-TB-1505 / TB-2049 - hub launcher hard-caps higher Evidence. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.";
