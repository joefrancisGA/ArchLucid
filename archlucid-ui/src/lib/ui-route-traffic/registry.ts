import { ADMIN_TRAFFIC_ROWS } from "@/lib/ui-route-traffic/admin-rows";
import { ALERTS_GOV_TRAFFIC_ROWS } from "@/lib/ui-route-traffic/alerts-gov-rows";
import { CORE_REVIEW_TRAFFIC_ROWS } from "@/lib/ui-route-traffic/core-review-rows";
import { HELP_TOPIC_TRAFFIC_ROWS } from "@/lib/ui-route-traffic/help-topic-rows";
import { INTEGRATIONS_TRAFFIC_ROWS } from "@/lib/ui-route-traffic/integrations-rows";
import { MARKETING_TRAFFIC_ROWS } from "@/lib/ui-route-traffic/marketing-rows";
import { OTHER_TRAFFIC_ROWS } from "@/lib/ui-route-traffic/other-rows";
import { TAB_SURFACE_TRAFFIC_ROWS } from "@/lib/ui-route-traffic/tab-surface-rows";
import type { UiRouteTrafficRow } from "@/lib/ui-route-traffic/types";

/** Every workbook row held as registry data, pinned by `registry.test.ts`. */
export const UI_ROUTE_TRAFFIC_ROWS: readonly UiRouteTrafficRow[] = [
  ...ADMIN_TRAFFIC_ROWS,
  ...ALERTS_GOV_TRAFFIC_ROWS,
  ...CORE_REVIEW_TRAFFIC_ROWS,
  ...HELP_TOPIC_TRAFFIC_ROWS,
  ...INTEGRATIONS_TRAFFIC_ROWS,
  ...MARKETING_TRAFFIC_ROWS,
  ...OTHER_TRAFFIC_ROWS,
  ...TAB_SURFACE_TRAFFIC_ROWS,
];

/**
 * Routes that still need a standalone `ui-route-traffic-*` module, because they export extra route
 * constants or are read by another test. New routes belong in the registry, so this list should only
 * ever shrink; `registry.test.ts` fails when a module appears that is not listed here.
 */
export const UI_ROUTE_TRAFFIC_STANDALONE_MODULES: readonly string[] = [
  "ui-route-traffic-administration-system-health",
  "ui-route-traffic-ai-usage-settings",
  "ui-route-traffic-alert-rules-routing-tab",
  "ui-route-traffic-alerts-inbox-tab",
  "ui-route-traffic-architecture-sponsor-dashboard",
  "ui-route-traffic-architecture-scorecard",
  "ui-route-traffic-architectures-list",
  "ui-route-traffic-developer-settings",
  "ui-route-traffic-digests-help",
  "ui-route-traffic-digests-schedule",
  "ui-route-traffic-evidence-graph",
  "ui-route-traffic-evidence-trace",
  "ui-route-traffic-sponsor-scorecard",
  "ui-route-traffic-sponsor-report",
  "ui-route-traffic-sponsor-report-help",
  "ui-route-traffic-first-review-guide",
  "ui-route-traffic-governance-dashboard",
  "ui-route-traffic-help-drawer",
  "ui-route-traffic-help-topic-catchall",
  "ui-route-traffic-impact-preview",
  "ui-route-traffic-legacy-settings-alerts",
  "ui-route-traffic-pattern-library",
  "ui-route-traffic-pattern-library-detail",
  "ui-route-traffic-planning-plan-detail",
  "ui-route-traffic-policy-packs-help",
  "ui-route-traffic-recommendation-learning",
  "ui-route-traffic-retired-advisory-scans-hub",
  "ui-route-traffic-retired-help-topic-aliases",
  "ui-route-traffic-retired-redirect-shims",
  "ui-route-traffic-retired-settings-exec-digest",
  "ui-route-traffic-review-workspace",
  "ui-route-traffic-reviews-new-detailed",
  "ui-route-traffic-reviews-new-guided-intake",
  "ui-route-traffic-reviews-new-quick-review",
  "ui-route-traffic-roi-summary",
  "ui-route-traffic-run-artifact-preview",
  "ui-route-traffic-signed-record-artifact-preview",
  "ui-route-traffic-signed-records-list",
];

export function findUiRouteTrafficRow(rowId: string): UiRouteTrafficRow | undefined {
  return UI_ROUTE_TRAFFIC_ROWS.find((row) => row.rowId === rowId);
}
