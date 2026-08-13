/**
 * Page-scoped context-sensitive help (Category 1 IA taxonomy) — short answers to up to four
 * questions per operator route. Long-form guides remain on `/help/{slug}` via `page-help-topic-map.ts`.
 *
 * Rows live in per-domain modules; this file only aggregates and resolves them.
 */

import {
  ARCHITECTURES_DRAFT_CONTEXTUAL_HELP,
  pathIsArchitectureDraftDetail,
} from "@/lib/architectures-draft-evidence-copy";
import { canonicalizeLegacyOperatorRoutePath } from "@/lib/canonicalize-legacy-operator-route-path";
import { ADMINISTRATION_CONTEXTUAL_HELP_ROWS, SETTINGS_HUB_CONTEXTUAL_HELP } from "@/lib/contextual-help/administration-rows";
import { API_KEYS_CONTEXTUAL_HELP_ROWS } from "@/lib/contextual-help/api-keys-rows";
import { AZURE_BOARDS_INTEGRATION_CONTEXTUAL_HELP_ROWS } from "@/lib/contextual-help/azure-boards-integration-rows";
import { BASELINE_SETTINGS_CONTEXTUAL_HELP_ROWS } from "@/lib/contextual-help/baseline-settings-rows";
import { ARCHITECTURE_DRAFTS_CONTEXTUAL_HELP_ROWS } from "@/lib/contextual-help/architecture-drafts-rows";
import { ARCHITECTURE_CONTEXTUAL_HELP_ROWS } from "@/lib/contextual-help/architecture-rows";
import { DIGESTS_CONTEXTUAL_HELP_ROWS } from "@/lib/contextual-help/digests-rows";
import { EVIDENCE_GRAPH_CONTEXTUAL_HELP_ROWS } from "@/lib/contextual-help/evidence-graph-rows";
import { JIRA_INTEGRATION_CONTEXTUAL_HELP_ROWS } from "@/lib/contextual-help/jira-integration-rows";
import { MODEL_GOVERNANCE_CONTEXTUAL_HELP_ROWS } from "@/lib/contextual-help/model-governance-rows";
import { SERVICENOW_INTEGRATION_CONTEXTUAL_HELP_ROWS } from "@/lib/contextual-help/servicenow-integration-rows";
import { SPONSOR_DASHBOARD_CONTEXTUAL_HELP_ROWS } from "@/lib/contextual-help/sponsor-dashboard-rows";
import { FINDINGS_CONTEXTUAL_HELP_ROWS } from "@/lib/contextual-help/findings-rows";
import { GOVERNANCE_CONTEXTUAL_HELP_ROWS } from "@/lib/contextual-help/governance-rows";
import { ARCHITECTURE_SCORECARD_CONTEXTUAL_HELP_ROWS } from "@/lib/contextual-help/architecture-scorecard-rows";
import { COMPARISON_REPLAY_CONTEXTUAL_HELP_ROWS } from "@/lib/contextual-help/comparison-replay-rows";
import { CONNECTION_STATUS_CONTEXTUAL_HELP_ROWS } from "@/lib/contextual-help/connection-status-rows";
import { NOTIFICATIONS_CONTEXTUAL_HELP_ROWS } from "@/lib/contextual-help/notifications-rows";
import { PATTERN_LIBRARY_CONTEXTUAL_HELP_ROWS } from "@/lib/contextual-help/pattern-library-rows";
import { PILOT_OUTCOMES_CONTEXTUAL_HELP_ROWS } from "@/lib/contextual-help/pilot-outcomes-rows";
import { PRIOR_MANIFEST_RETRIEVAL_CONTEXTUAL_HELP_ROWS } from "@/lib/contextual-help/prior-manifest-retrieval-rows";
import { PREFERENCES_CONTEXTUAL_HELP_ROWS } from "@/lib/contextual-help/preferences-rows";
import { RECURRENCE_SCHEDULES_CONTEXTUAL_HELP_ROWS } from "@/lib/contextual-help/recurrence-schedules-rows";
import { ROI_SUMMARY_CONTEXTUAL_HELP_ROWS } from "@/lib/contextual-help/roi-summary-rows";
import { SEARCH_REVIEW_EVIDENCE_CONTEXTUAL_HELP_ROWS } from "@/lib/contextual-help/search-review-evidence-rows";
import { SLACK_INTEGRATION_CONTEXTUAL_HELP_ROWS } from "@/lib/contextual-help/slack-integration-rows";
import { STANDARDS_RULES_CONTEXTUAL_HELP_ROWS } from "@/lib/contextual-help/standards-rules-rows";
import { TEAMS_INTEGRATION_CONTEXTUAL_HELP_ROWS } from "@/lib/contextual-help/teams-integration-rows";
import { WEBHOOKS_INTEGRATION_CONTEXTUAL_HELP_ROWS } from "@/lib/contextual-help/webhooks-integration-rows";
import { SYSTEM_HEALTH_CONTEXTUAL_HELP_ROWS } from "@/lib/contextual-help/system-health-rows";
import { WORKSPACE_SETTINGS_CONTEXTUAL_HELP_ROWS } from "@/lib/contextual-help/workspace-settings-rows";
import { HELP_TOPIC_CONTEXTUAL_HELP_ROWS } from "@/lib/contextual-help/help-topic-rows";
import { AI_USAGE_CONTEXTUAL_HELP_ROWS } from "@/lib/contextual-help/ai-usage-rows";
import { INSIGHTS_CONTEXTUAL_HELP_ROWS } from "@/lib/contextual-help/insights-rows";
import { INTEGRATIONS_CONTEXTUAL_HELP_ROWS } from "@/lib/contextual-help/integrations-rows";
import { INTERNAL_OPS_CONTEXTUAL_HELP_ROWS } from "@/lib/contextual-help/internal-ops-rows";
import { MARKETING_CONTEXTUAL_HELP_ROWS } from "@/lib/contextual-help/marketing-rows";
import type { PageContextualHelpEntry, PageContextualHelpRow } from "@/lib/contextual-help/types";
import {
  EVIDENCE_TRACE_CONTEXTUAL_HELP,
  pathIsFindingEvidenceTrace,
} from "@/lib/evidence-trace-contextual-help";
import {
  PROVENANCE_CONTEXTUAL_HELP,
  pathIsRunProvenance,
} from "@/lib/provenance-evidence-copy";
import { pathIsSettingsHubRoot } from "@/lib/settings-admin-route-paths";

const PAGE_CONTEXTUAL_HELP: readonly PageContextualHelpRow[] = [
  ...ADMINISTRATION_CONTEXTUAL_HELP_ROWS,
  ...AI_USAGE_CONTEXTUAL_HELP_ROWS,
  ...API_KEYS_CONTEXTUAL_HELP_ROWS,
  ...ARCHITECTURE_CONTEXTUAL_HELP_ROWS,
  ...ARCHITECTURE_DRAFTS_CONTEXTUAL_HELP_ROWS,
  ...AZURE_BOARDS_INTEGRATION_CONTEXTUAL_HELP_ROWS,
  ...BASELINE_SETTINGS_CONTEXTUAL_HELP_ROWS,
  ...COMPARISON_REPLAY_CONTEXTUAL_HELP_ROWS,
  ...DIGESTS_CONTEXTUAL_HELP_ROWS,
  ...EVIDENCE_GRAPH_CONTEXTUAL_HELP_ROWS,
  ...FINDINGS_CONTEXTUAL_HELP_ROWS,
  ...GOVERNANCE_CONTEXTUAL_HELP_ROWS,
  ...ARCHITECTURE_SCORECARD_CONTEXTUAL_HELP_ROWS,
  ...CONNECTION_STATUS_CONTEXTUAL_HELP_ROWS,
  ...NOTIFICATIONS_CONTEXTUAL_HELP_ROWS,
  ...PATTERN_LIBRARY_CONTEXTUAL_HELP_ROWS,
  ...PREFERENCES_CONTEXTUAL_HELP_ROWS,
  ...PILOT_OUTCOMES_CONTEXTUAL_HELP_ROWS,
  ...PRIOR_MANIFEST_RETRIEVAL_CONTEXTUAL_HELP_ROWS,
  ...RECURRENCE_SCHEDULES_CONTEXTUAL_HELP_ROWS,
  ...ROI_SUMMARY_CONTEXTUAL_HELP_ROWS,
  ...SEARCH_REVIEW_EVIDENCE_CONTEXTUAL_HELP_ROWS,
  ...SLACK_INTEGRATION_CONTEXTUAL_HELP_ROWS,
  ...SYSTEM_HEALTH_CONTEXTUAL_HELP_ROWS,
  ...STANDARDS_RULES_CONTEXTUAL_HELP_ROWS,
  ...TEAMS_INTEGRATION_CONTEXTUAL_HELP_ROWS,
  ...WEBHOOKS_INTEGRATION_CONTEXTUAL_HELP_ROWS,
  ...WORKSPACE_SETTINGS_CONTEXTUAL_HELP_ROWS,
  ...HELP_TOPIC_CONTEXTUAL_HELP_ROWS,
  ...INSIGHTS_CONTEXTUAL_HELP_ROWS,
  ...INTEGRATIONS_CONTEXTUAL_HELP_ROWS,
  ...INTERNAL_OPS_CONTEXTUAL_HELP_ROWS,
  ...JIRA_INTEGRATION_CONTEXTUAL_HELP_ROWS,
  ...MARKETING_CONTEXTUAL_HELP_ROWS,
  ...MODEL_GOVERNANCE_CONTEXTUAL_HELP_ROWS,
  ...SERVICENOW_INTEGRATION_CONTEXTUAL_HELP_ROWS,
  ...SPONSOR_DASHBOARD_CONTEXTUAL_HELP_ROWS,
];

/**
 * Longest prefix first, so a specific route wins over its hub. Sorted once at module load because
 * the resolver runs on every architect navigation.
 */
const PAGE_CONTEXTUAL_HELP_BY_SPECIFICITY: readonly PageContextualHelpRow[] = [...PAGE_CONTEXTUAL_HELP].sort(
  (left, right) => right.prefix.length - left.prefix.length,
);

/** Route matchers that answer for parameterized paths a literal prefix cannot express. */
const PARAMETERIZED_ROUTE_MATCHERS: readonly {
  readonly matches: (path: string) => boolean;
  readonly entry: PageContextualHelpEntry;
}[] = [
  { matches: pathIsRunProvenance, entry: PROVENANCE_CONTEXTUAL_HELP },
  { matches: pathIsFindingEvidenceTrace, entry: EVIDENCE_TRACE_CONTEXTUAL_HELP },
  { matches: pathIsArchitectureDraftDetail, entry: ARCHITECTURES_DRAFT_CONTEXTUAL_HELP },
  { matches: pathIsSettingsHubRoot, entry: SETTINGS_HUB_CONTEXTUAL_HELP },
];

/** All registry rows — exported for content-constraint Vitest guards. */
export function allPageContextualHelpRows(): readonly PageContextualHelpRow[] {
  return PAGE_CONTEXTUAL_HELP;
}

/** Strips the query string and rewrites retired operator paths to their canonical route. */
function normalizePathname(pathname: string): string {
  const rawPath = (pathname ?? "").split("?")[0] ?? "";

  return (canonicalizeLegacyOperatorRoutePath(rawPath).split("?")[0] ?? rawPath).trim() || "/";
}

/** Resolve short-form contextual help for an architect pathname, or `null` when not migrated yet. */
export function contextualHelpForPathname(pathname: string): PageContextualHelpEntry | null {
  const path = normalizePathname(pathname);
  const parameterized = PARAMETERIZED_ROUTE_MATCHERS.find((matcher) => matcher.matches(path));

  if (parameterized !== undefined) {
    return parameterized.entry;
  }

  const row = PAGE_CONTEXTUAL_HELP_BY_SPECIFICITY.find(
    (candidate) => path === candidate.prefix || path.startsWith(`${candidate.prefix}/`),
  );

  return row?.entry ?? null;
}
