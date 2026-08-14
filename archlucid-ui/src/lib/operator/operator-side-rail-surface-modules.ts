/**
 * TB-1576 — Module paths scanned for each `OPERATOR_SIDE_RAIL_INVENTORY` row.
 *
 * Extend when adding a new inventory exemplar; keep paths posix-relative to `src/`.
 */

import type { OperatorSideRailInventoryEntry } from "@/lib/operator/operator-side-rail-inventory";

export const OPERATOR_SIDE_RAIL_SURFACE_MODULE_BY_ID: Readonly<
  Record<OperatorSideRailInventoryEntry["id"], readonly string[]>
> = {
  "recurrence-schedules": ["components/governance/RecurrenceSchedulesClient.tsx"],
  "advisory-schedules": ["components/advisory/AdvisorySchedulesContent.tsx"],
  "digests-schedule": ["components/digests/ExecDigestScheduleContent.tsx"],
  "alert-rules-rules-tab": ["components/alerts/AlertRulesContent.tsx"],
  "digests-browse": [
    "components/digests/DigestsBrowseContent.tsx",
    "components/digests/DigestsBrowseHistorySkeleton.tsx",
  ],
  "run-detail-workspace": [
    "app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailWorkspaceShell.tsx",
  ],
  "help-topic-toc": ["components/help/HelpTopicTableOfContents.tsx"],
  "integrations-slack": [
    "app/(operator)/integrations/slack/_sections/SlackIntegrationPageClient.tsx",
    "app/(operator)/integrations/slack/_sections/SlackIntegrationAside.tsx",
  ],
  "integrations-teams": [
    "app/(operator)/integrations/teams/_sections/TeamsNotificationsIntegrationPageView.tsx",
  ],
  "integrations-azure-boards": [
    "app/(operator)/integrations/azure-boards/_sections/AzureBoardsIntegrationPageClient.tsx",
    "app/(operator)/integrations/azure-boards/_sections/AzureBoardsIntegrationAside.tsx",
  ],
  "integrations-servicenow": [
    "app/(operator)/integrations/servicenow/_sections/ServiceNowIntegrationPageClient.tsx",
    "app/(operator)/integrations/servicenow/_sections/ServiceNowIntegrationAside.tsx",
  ],
};

export function listOperatorSideRailSurfaceModules(
  entry: OperatorSideRailInventoryEntry,
): readonly string[] {
  return OPERATOR_SIDE_RAIL_SURFACE_MODULE_BY_ID[entry.id] ?? [];
}
