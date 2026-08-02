import { FINDINGS_HELP_PATH } from "@/lib/findings-help-route";

/**
 * Traffic workbook row ID for Findings help.
 * Owner backlog shorthand: HFX.
 */
export const FINDINGS_HELP_TRAFFIC_ROW_ID = "HFX";

/** Canonical path tracked on the HFX workbook row. */
export const FINDINGS_HELP_TRAFFIC_PATH = FINDINGS_HELP_PATH;

/** Workbook Section column value — in-app help topic, not marketing. */
export const FINDINGS_HELP_TRAFFIC_SECTION = "Help topic";

/**
 * Owner workbook Notes for HFX — documents the specialty HelpFindingsGuideView surface.
 */
export const FINDINGS_HELP_TRAFFIC_NOTE =
  "Specialty findings guide — HelpFindingsGuideView with anatomy panel, severity table, lifecycle sections, and HelpFindingsWorkspaceReadinessStrip (live governance queue). Featured help-center product tier. Primary CTAs to /governance/findings, evidence search, and decision register. Related docs link to audit-trail not API contracts (TB-1250 / TB-1387). Not bare HelpTopicMarkdownView.";
