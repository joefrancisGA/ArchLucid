import { stripMarkdownSectionsByTitlePrefix } from "@/lib/help-markdown/section-strips";
import { rewriteProcurementFaqBuyerPresentation } from "@/lib/procurement-help-presentation";
import {
  applyLeakageRewriteTable,
  applyLeakageRewriteTableThenCleanup,
} from "../leakage-rewrite-table";
import {
  CAIQ_SIG_LEAKAGE_REWRITES,
  DEVELOPER_TROUBLESHOOTING_LEAKAGE_REWRITES,
  DPA_TEMPLATE_LEAKAGE_REWRITES,
  PATH_CHOOSER_LEAKAGE_REWRITES,
  PROCUREMENT_LEAKAGE_REWRITES,
} from "../contributor-leakage-rewrite-tables";

import {
  FIRST_REVIEW_EVIDENCE_OMITTED_SECTION_PREFIXES,
  CLI_USAGE_OMITTED_SECTION_PREFIXES,
  PATH_CHOOSER_STRUCTURED_UI_SECTION_TITLES,
  EVIDENCE_INTAKE_STRUCTURED_UI_SECTION_PREFIXES,
  EVIDENCE_TRAIL_STRUCTURED_UI_SECTION_PREFIXES
} from "./internal";
export function stripFirstReviewEvidenceChecklistContributorSections(markdown: string): string {
  return stripMarkdownSectionsByTitlePrefix(markdown, FIRST_REVIEW_EVIDENCE_OMITTED_SECTION_PREFIXES);
}
export function stripFirstReviewEvidenceChecklistContributorLeakage(markdown: string): string {
  return markdown
    .replace(/`GET \/health\/ready`/gi, "API readiness check")
    .replace(/GET \/health\/ready/gi, "API readiness check")
    .replace(/`POST \/v1\/azure-extractor\/upload`/gi, "extractor ZIP upload")
    .replace(/POST \/v1\/azure-extractor\/upload/gi, "extractor ZIP upload")
    .replace(/`?\/version`?/gi, "version endpoint")
    .replace(/`?X-Correlation-ID`?/gi, "correlation id")
    .replace(/\[([^\]]*)\]\(\.\.\/library\/CONFIGURATION_REFERENCE\.md\)/gi, "[Troubleshooting](/help/troubleshooting)")
    .replace(/\[([^\]]*)\]\(\.\.\/library\/contributor-reference\/SECURITY\.md\)/gi, "[Security and trust](/help/security-trust)")
    .replace(/\[([^\]]*)\]\(FIRST_PILOT_OPERATOR_PATH\.md\)/gi, "[Troubleshooting](/help/troubleshooting)")
    .replace(/\[([^\]]*)\]\(\.\.\/library\/customer-facing\/PILOT_GUIDE\.md\)/gi, "[Your first architecture review](/help/first-architecture-review)")
    .replace(/\[([^\]]*)\]\(\.\.\/library\/AZURE_EXTRACTOR\.md[^)]*\)/gi, "[Connect Azure securely](/help/cloud-connections/azure)")
    .replace(
      /\[([^\]]*)\]\(\.\.\/library\/CANONICAL_FIRST_RUN_PATH\.md[^)]*\)/gi,
      "[Your first architecture review](/help/first-architecture-review)",
    )
    .replace(
      /\[([^\]]*)\]\(\.\.\/library\/customer-facing\/WORKSPACE_NAVIGATION_GUIDE\.md\)/gi,
      "[Workspace navigation profile](/help/pilot-guide)",
    )
    .replace(/\[([^\]]*)\]\(\.\.\/runbooks\/TROUBLESHOOTING\.md\)/gi, "[Troubleshooting](/help/troubleshooting)")
    .replace(/\[([^\]]*)\]\(TROUBLESHOOTING\.md\)/gi, "[Troubleshooting](/help/troubleshooting)")
    .replace(/\[([^\]]*)\]\(\.\.\/library\/V1_SCOPE\.md[^)]*\)/gi, "product scope")
    .replace(/\[([^\]]*)\]\(\.\.\/library\/REPEAT_REVIEW_LOOP\.md\)/gi, "[Repeat-review loop](/help/repeat-review-loop)")
    .replace(/\[([^\]]*)\]\([^)]*contributor-reference\/[^)]+\)/gi, "$1")
    .replace(/\[([^\]]*)\]\([^)]*(?:runbooks|library|deploy)\/[^)]+\)/gi, "$1")
    .replace(/\[([^\]]*)\]\([^)]+\.md[^)]*\)/gi, "$1")
    .replace(/`?CONFIGURATION_REFERENCE\.md`?/gi, "configuration reference")
    .replace(/`?SECURITY\.md`?/gi, "security documentation")
    .replace(/`?FIRST_PILOT_OPERATOR_PATH\.md`?/gi, "first-pilot workspace guidance")
    .replace(/`?PILOT_GUIDE\.md`?/gi, "pilot guide")
    .replace(/`?AZURE_EXTRACTOR\.md`?/gi, "Azure extractor guidance")
    .replace(/`?CANONICAL_FIRST_RUN_PATH\.md`?/gi, "first architecture review walkthrough")
    .replace(/`?WORKSPACE_NAVIGATION_GUIDE\.md`?/gi, "workspace navigation guide")
    .replace(/`?TROUBLESHOOTING\.md`?/gi, "troubleshooting")
    .replace(/`?V1_SCOPE\.md`?/gi, "product scope")
    .replace(/`?PILOT_RESCUE_PLAYBOOK\.md`?/gi, "troubleshooting guide")
    .replace(/`?LIVE_E2E_HAPPY_PATH\.md`?/gi, "live happy-path guidance")
    .replace(/`?OPERATOR_PILOT_STICKINESS_CHECKLIST\.md`?/gi, "stickiness checklist")
    .replace(/`?REPEAT_REVIEW_LOOP\.md`?/gi, "repeat-review loop")
    .replace(/`?scripts\/[^`\s)]+`?/gi, "admin automation script")
    .replace(/\.\\scripts\\[^\s)`]*/gi, "admin automation script")
    .replace(/\.\/scripts\/[^\s)`]*/gi, "admin automation script")
    .replace(/collect-first-pilot-proof\.ps1/gi, "admin automation script")
    .replace(/deploy\/customer-templates\/[^\s)`]*/gi, "customer WIF templates")
    .replace(/python scripts\/[^\s)`]*/gi, "admin automation script")
    .replace(/\n{3,}/g, "\n\n")
    .trimEnd();
}
export function stripCliUsageContributorSections(markdown: string): string {
  return stripMarkdownSectionsByTitlePrefix(markdown, CLI_USAGE_OMITTED_SECTION_PREFIXES);
}
export function stripCliUsageContributorLeakage(markdown: string): string {
  return stripCliUsageContributorSections(markdown)
    .replace(/https:\/\/staging\.archlucid\.net/gi, "https://<your-archlucid-host>")
    .replace(/\[([^\]]*)\]\(\.\.\/runbooks\/TROUBLESHOOTING\.md[^)]*\)/gi, "[Engineering troubleshooting](/help/engineering-troubleshooting)")
    .replace(/\[([^\]]*)\]\(\.\.\/library\/TROUBLESHOOTING\.md[^)]*\)/gi, "[Engineering troubleshooting](/help/engineering-troubleshooting)")
    .replace(/\[([^\]]*)\]\(TROUBLESHOOTING\.md[^)]*\)/gi, "[Engineering troubleshooting](/help/engineering-troubleshooting)")
    .replace(/\[([^\]]*)\]\(\.\.\/runbooks\/TRIAL_FUNNEL_END_TO_END\.md[^)]*\)/gi, "[Engineering troubleshooting](/help/engineering-troubleshooting)")
    .replace(
      /\[([^\]]*)\]\(\.\.\/go-to-market\/ROI_MODEL\.md[^)]*\)/gi,
      "[Pilot ROI measurement](/help/executive-summary#pilot-roi-measurement)",
    )
    .replace(
      /\[([^\]]*)\]\(\.\.\/go-to-market\/SAMPLE_AGGREGATE_ROI_BULLETIN_SYNTHETIC\.md[^)]*\)/gi,
      "[Pilot ROI measurement](/help/executive-summary#pilot-roi-measurement)",
    )
    .replace(/\[([^\]]*)\]\(\.\.\/go-to-market\/PRICING_PHILOSOPHY\.md[^)]*\)/gi, "[Procurement](/help/procurement)")
    .replace(/\[([^\]]*)\]\(\.\.\/go-to-market\/AZURE_MARKETPLACE_SAAS_OFFER\.md[^)]*\)/gi, "")
    .replace(/\[([^\]]*)\]\(\.\.\/go-to-market\/[^)]+\)/gi, "")
    .replace(/`dbo\.AuditEvents`/gi, "audit trail")
    .replace(/dbo\.AuditEvents/gi, "audit trail")
    .replace(/without owner approval/gi, "without lowering the configured gate")
    .replace(/`--staging`/gi, "")
    .replace(/\s*\[--staging\]/gi, "")
    .replace(/\(--staging[^)]*\)/gi, "")
    .replace(/\s+--staging\b/gi, "")
    .replace(/C:\\ArchLucid[^\s)`]*/gi, "")
    .replace(/Partner Center/gi, "")
    .replace(/\bpayout\b/gi, "")
    .replace(/\btax\b/gi, "")
    .replace(/forbidden sales promises/gi, "")
    .replace(/Full checklist:\s*Developer [Tt]roubleshooting(?:\s*\([^)]*\))?\.?/g, "")
    .replace(/Full checklist:\s*Troubleshooting(?:\s*\([^)]*\))?\.?/g, "")
    .replace(/see \[[^\]]+\]\([^)]+\) and \[([^\]]+)\]\(\)/g, "see [$1](/help/engineering-troubleshooting)")
    .replace(/\n{3,}/g, "\n\n")
    .trimEnd();
}
export function stripDeveloperTroubleshootingContributorLeakage(markdown: string): string {
  return applyLeakageRewriteTableThenCleanup(markdown, DEVELOPER_TROUBLESHOOTING_LEAKAGE_REWRITES);
}
export function softenEvidenceIntakeHelpPresentation(markdown: string): string {
  return markdown.replace(/admission gates/gi, "readiness checks");
}
export function stripEvidenceIntakeStructuredUiSections(markdown: string): string {
  return stripMarkdownSectionsByTitlePrefix(markdown, EVIDENCE_INTAKE_STRUCTURED_UI_SECTION_PREFIXES, {
    collapseBlankLines: true,
  });
}
export function stripEvidenceTrailStructuredUiSections(markdown: string): string {
  return stripMarkdownSectionsByTitlePrefix(markdown, EVIDENCE_TRAIL_STRUCTURED_UI_SECTION_PREFIXES, {
    collapseBlankLines: true,
  });
}
export function stripPathChooserStructuredUiSections(markdown: string): string {
  return stripMarkdownSectionsByTitlePrefix(markdown, PATH_CHOOSER_STRUCTURED_UI_SECTION_TITLES, {
    collapseBlankLines: true,
  });
}
export function stripPathChooserContributorLeakage(markdown: string): string {
  return applyLeakageRewriteTableThenCleanup(markdown, PATH_CHOOSER_LEAKAGE_REWRITES);
}
