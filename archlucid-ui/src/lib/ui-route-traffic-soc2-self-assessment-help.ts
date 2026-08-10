import { SOC2_SELF_ASSESSMENT_HELP_PATH } from "@/lib/soc2-self-assessment-help-route";

/**
 * Traffic workbook row ID for SOC 2 self-assessment help.
 * Owner backlog shorthand: HES.
 */
export const SOC2_SELF_ASSESSMENT_HELP_TRAFFIC_ROW_ID = "HES";

/** Canonical path tracked on the HES workbook row. */
export const SOC2_SELF_ASSESSMENT_HELP_TRAFFIC_PATH = SOC2_SELF_ASSESSMENT_HELP_PATH;

/** Workbook Section column value â€” in-app help topic, not marketing. */
export const SOC2_SELF_ASSESSMENT_HELP_TRAFFIC_SECTION = "Help topic";

/**
 * Owner workbook Notes for HES â€” documents the specialty buyer self-assessment guide surface.
 */
export const SOC2_SELF_ASSESSMENT_HELP_TRAFFIC_NOTE =
  "Specialty SOC 2 self-assessment guide - HelpSoc2SelfAssessmentGuideView with Trust Center / CAIQ-SIG / procurement primary CTAs, Sources diligence strip (security-trust, DPA, subprocessors, tenant-isolation), job-matrix IA dual (TB-1749), orientation steps, claim-discipline callout (self-assessment is not CPA Type I/II; Type I dates illustrative), PageContextualHelp, and prepared SOC2_SELF_ASSESSMENT_2026.md (TB-1747 leakage strip + TB-1748 roadmap honesty). Title + Help Center product discovery (TB-1750). Not bare HelpTopicMarkdownView. Score 61/100 (2026-08-08) - surface hard-caps higher Evidence. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.";
