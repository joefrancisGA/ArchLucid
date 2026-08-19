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
  CONFIGURATION_REFERENCE_OMITTED_SECTION_PREFIXES
} from "./internal";
export function stripProcurementContributorLeakage(markdown: string): string {
  return rewriteProcurementFaqBuyerPresentation(
    applyLeakageRewriteTable(markdown, PROCUREMENT_LEAKAGE_REWRITES),
  );
}
export function stripConfigurationReferenceContributorSections(markdown: string): string {
  return stripMarkdownSectionsByTitlePrefix(markdown, CONFIGURATION_REFERENCE_OMITTED_SECTION_PREFIXES);
}
export function stripConfigurationReferenceContributorLeakage(markdown: string): string {
  let inFence = false;

  const withoutSensitiveRows = markdown
    .split("\n")
    .filter((line) => {
      const trimmedStart = line.trimStart();

      if (trimmedStart.startsWith("```")) {
        inFence = !inFence;
        return true;
      }

      if (inFence) {
        return true;
      }

      if (/AllowRlsBypass/i.test(line)) {
        return false;
      }

      if (/InternalCrossTenantAnalytics/i.test(line)) {
        return false;
      }

      if (/\*\*Release-candidate gates/i.test(line)) {
        return false;
      }

      return true;
    })
    .join("\n");

  return withoutSensitiveRows
    .replace(/\s*\(TB-\d+\)/gi, "")
    .replace(/\bTB-\d+\b/gi, "")
    .replace(/\[ADR\s+\d+\]\([^)]+\)/gi, "production secrets guidance")
    .replace(/\bADR\s+\d+\b/gi, "production secrets guidance")
    .replace(/docs\/architecture\/adrs\/[^\s)]+/gi, "architecture guidance")
    .replace(/`?scripts\/[^`\s)]+`?/gi, "release readiness checks")
    .replace(/\bscripts\/[^\s)]+/gi, "release readiness checks")
    .replace(/`?fixtures\/release-candidate\/[^`\s)]*`?/gi, "release-candidate baseline config")
    .replace(/fixtures\/release-candidate\/[^\s)]*/gi, "release-candidate baseline config")
    .replace(/`?artifacts\/release-readiness\/[^`\s)]*`?/gi, "release readiness evidence")
    .replace(/artifacts\/release-readiness\/[^\s)]*/gi, "release readiness evidence")
    .replace(/\[([^\]]*)\]\(contributor-reference\/SECURITY\.md\)/gi, "security documentation")
    .replace(/contributor-reference\/SECURITY\.md/gi, "security documentation")
    .replace(/contributor-reference\//gi, "")
    .replace(/\[([^\]]*)\]\(V1_SCOPE\.md[^)]*\)/gi, "product scope")
    .replace(/`?V1_SCOPE\.md`?/gi, "product scope")
    .replace(/docs\/library\/V1_SCOPE\.md/gi, "product scope")
    .replace(/\[([^\]]*)\]\([^)]*SECURITY\.md\)/gi, "security documentation")
    .replace(/`?SECURITY\.md`?/gi, "security documentation")
    .replace(/PUBLIC_MARKETING_SITE_TOPOLOGY\.md/gi, "marketing site topology")
    .replace(/`?\.\\scripts\\[^`\s]+`?/gi, "prerequisite validation")
    .replace(/\.\\scripts\\[^\s)]+/gi, "prerequisite validation")
    // TB-1330 — map eng runbook/ADR hrefs to in-app help (or plain text) so product body stays product-routed.
    .replace(
      /\[([^\]]*)\]\((?:\.\.\/)?(?:docs\/)?runbooks\/GENERIC_OIDC_SETUP\.md\)/gi,
      "[Authentication and sign-in](/help/authentication-sign-in)",
    )
    .replace(
      /\[([^\]]*)\]\((?:\.\.\/)?(?:docs\/)?runbooks\/PILOT_PREREQUISITES\.md\)/gi,
      "[Enterprise onboarding](/help/enterprise-onboarding)",
    )
    .replace(
      /\[([^\]]*)\]\((?:\.\.\/)?(?:docs\/)?runbooks\/MINIMAL_AZURE_PILOT_DEPLOYMENT\.md\)/gi,
      "[Cloud connections](/help/cloud-connections)",
    )
    .replace(
      /\[([^\]]*)\]\((?:\.\.\/)?(?:docs\/)?runbooks\/SAML_SP_CERTIFICATE_ROTATION_RUNBOOK\.md\)/gi,
      "[Authentication and sign-in](/help/authentication-sign-in)",
    )
    .replace(
      /\[([^\]]*)\]\((?:\.\.\/)?(?:docs\/)?runbooks\/DATABASE_FAILOVER\.md\)/gi,
      "database failover guidance",
    )
    .replace(
      /\[([^\]]*)\]\((?:\.\.\/)?(?:docs\/)?runbooks\/LLM_COST_ESTIMATION\.md\)/gi,
      "LLM cost estimation guidance",
    )
    .replace(
      /\[([^\]]*)\]\((?:\.\.\/)?(?:docs\/)?runbooks\/MANIFEST_CHUNK_SUMMARIZATION\.md\)/gi,
      "manifest summarization guidance",
    )
    .replace(
      /\[([^\]]*)\]\((?:\.\.\/)?(?:docs\/)?runbooks\/[^)]+\)/gi,
      "$1",
    )
    .replace(/\[([^\]]*)\]\([^)]*architecture\/adrs\/[^)]+\)/gi, "$1")
    .replace(/\[([^\]]*)\]\(HOSTED_ENTERPRISE_ONBOARDING_CHECKLIST\.md[^)]*\)/gi, "[Enterprise onboarding](/help/enterprise-onboarding)")
    .replace(/\[([^\]]*)\]\(API_AUTH_BEHAVIOR_CONTRACT\.md[^)]*\)/gi, "[Authentication and sign-in](/help/authentication-sign-in)")
    .replace(/\[([^\]]*)\]\(READ_REPLICA_ROUTING\.md[^)]*\)/gi, "$1")
    .replace(/\n{3,}/g, "\n\n");
}
