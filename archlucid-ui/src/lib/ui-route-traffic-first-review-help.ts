import { FIRST_REVIEW_HELP_PATH } from "@/lib/first-review-help-route";

/**
 * Traffic workbook row ID for First-run evidence checklist help.
 * Owner backlog shorthand: FI.
 */
export const FIRST_REVIEW_HELP_TRAFFIC_ROW_ID = "FI";

/** Canonical path tracked on the FI workbook row. */
export const FIRST_REVIEW_HELP_TRAFFIC_PATH = FIRST_REVIEW_HELP_PATH;

/** Workbook Section column value - in-app help topic, not marketing. */
export const FIRST_REVIEW_HELP_TRAFFIC_SECTION = "Help topic";

/**
 * Owner workbook Notes for FI - documents the specialty Admin SE checklist surface.
 * ASCII-only for Windows console note scripts.
 */
export const FIRST_REVIEW_HELP_TRAFFIC_NOTE =
  "Specialty first-run evidence checklist (Admin internal-runbook) - HelpFirstReviewEvidenceChecklistGuideView with first-architecture-review / Start architecture review / audit primary CTAs, Sources diligence strip (complete review workflow, Azure connect, audit-trail, troubleshooting, configuration-reference), evidence arc, claim-discipline callout (checklist is not certification), PageContextualHelp, and prepared FIRST_PILOT_OPERATOR_PATH.md printable section only (`sectionAnchors` + API/runbook/script leakage strip). `FIRST_RUN_EVIDENCE_CHECKLIST.md` is a path-stable alias. Not bare HelpTopicMarkdownView. Admin-gated internal Help Center tier. Not a redirect to buyer core-pilot. Does not imply CPA SOC 2 or third-party pen-test publication. Score 61/100 (2026-08-08) - specialty checklist hard-caps higher Evidence. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.";
