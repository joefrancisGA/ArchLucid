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
  ENTERPRISE_ONBOARDING_OMITTED_SECTION_PREFIXES
} from "./internal";
export function stripEnterpriseOnboardingQuickLinksBlock(markdown: string): string {
  const lines = markdown.split("\n");
  const result: string[] = [];
  let omitBlockquote = false;

  for (const line of lines) {
    if (/^>\s*\*\*Quick links\*\*/i.test(line)) {
      omitBlockquote = true;
      continue;
    }

    if (omitBlockquote) {
      if (line.trim() === "---" || (line.startsWith("## ") && !line.startsWith("###"))) {
        omitBlockquote = false;

        if (line.trim() !== "---") {
          result.push(line);
        }
      }

      continue;
    }

    result.push(line);
  }

  return result.join("\n");
}
export function stripEnterpriseOnboardingContributorSections(markdown: string): string {
  return stripMarkdownSectionsByTitlePrefix(markdown, ENTERPRISE_ONBOARDING_OMITTED_SECTION_PREFIXES);
}
export function stripEnterpriseOnboardingContributorLeakage(markdown: string): string {
  const lines = markdown.split("\n");
  const result: string[] = [];
  let inFence = false;
  let detailsBuffer: string[] | null = null;

  const flushDetailsBuffer = (): void => {
    if (detailsBuffer === null) {
      return;
    }

    const block = detailsBuffer.join("\n");
    detailsBuffer = null;

    // Drop eng-only configuration-keys disclosure (CLI / appsettings helpers).
    if (
      /configuration keys/i.test(block) ||
      /archlucid auth\b/i.test(block) ||
      /archlucid saml\b/i.test(block) ||
      /\bappsettings\b/i.test(block)
    ) {
      return;
    }

    for (const bufferedLine of block.split("\n")) {
      result.push(bufferedLine);
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    const trimmedStart = line.trimStart();

    if (trimmedStart.startsWith("```")) {
      inFence = !inFence;
    }

    if (!inFence && /^<details\b/i.test(trimmed)) {
      detailsBuffer = [line];
      continue;
    }

    if (detailsBuffer !== null) {
      detailsBuffer.push(line);

      if (/^<\/details>/i.test(trimmed)) {
        flushDetailsBuffer();
      }

      continue;
    }

    if (!inFence && /^\*\*Evidence tier:\*\*/i.test(trimmed)) {
      continue;
    }

    if (
      !inFence &&
      (/archlucid auth\b/i.test(line) || /archlucid saml\b/i.test(line) || /\bappsettings\b/i.test(line))
    ) {
      continue;
    }

    result.push(line);
  }

  flushDetailsBuffer();

  return result
    .join("\n")
    .replace(/\bOIDC JwtBearer\b/gi, "OpenID Connect (OIDC)")
    .replace(/\bJwtBearer\b/g, "OpenID Connect")
    .replace(/`ClaimMappingJson`/g, "role claim mapping")
    .replace(/\bClaimMappingJson\b/g, "role claim mapping")
    .replace(/`claim-mapping\.json`/gi, "role claim mapping file")
    .replace(/\bclaim-mapping\.json\b/gi, "role claim mapping file")
    .replace(/\n{3,}/g, "\n\n");
}
export function stripEvaluatorWorkbookContributorLeakage(markdown: string): string {
  const lines = markdown.split("\n");
  const result: string[] = [];
  let inFence = false;
  let detailsBuffer: string[] | null = null;

  const flushDetailsBuffer = (): void => {
    if (detailsBuffer === null) {
      return;
    }

    const block = detailsBuffer.join("\n");
    detailsBuffer = null;

    if (
      /CLI and proof/i.test(block) ||
      /collect-first-pilot-proof/i.test(block) ||
      /ArchLucid\.Cli/i.test(block) ||
      /ARCHLUCID_API_URL/i.test(block)
    ) {
      return;
    }

    for (const bufferedLine of block.split("\n")) {
      result.push(bufferedLine);
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    const trimmedStart = line.trimStart();

    if (trimmedStart.startsWith("```")) {
      inFence = !inFence;
    }

    if (!inFence && /^<details\b/i.test(trimmed)) {
      detailsBuffer = [line];
      continue;
    }

    if (detailsBuffer !== null) {
      detailsBuffer.push(line);

      if (/^<\/details>/i.test(trimmed)) {
        flushDetailsBuffer();
      }

      continue;
    }

    if (
      !inFence &&
      (/collect-first-pilot-proof/i.test(line) ||
        /ArchLucid\.Cli/i.test(line) ||
        /ARCHLUCID_API_URL/i.test(line) ||
        /\.\/scripts\//i.test(line))
    ) {
      continue;
    }

    result.push(line);
  }

  flushDetailsBuffer();

  return result
    .join("\n")
    .replace(/\(former EVALUATION_GUIDE\)/gi, "")
    .replace(/\bTier-1\b/g, "optional")
    .replace(/\bPilotStrict\b/g, "strict AI quality checks")
    .replace(/\bauthority pipeline\b/gi, "architecture analysis")
    .replace(/\[`?BUYER_FIRST_30_MINUTES\.md`?\]\([^)]+\)/gi, "[Your first architecture review](/help/first-architecture-review)")
    .replace(/\[`?SECOND_RUN\.md`?\]\([^)]+\)/gi, "[Repeat a review](/help/repeat-review-loop)")
    .replace(
      /\[`?FIRST_PILOT_OPERATOR_PATH\.md`?\]\([^)]+\)/gi,
      "[Your first architecture review](/help/first-architecture-review)",
    )
    .replace(
      /\[`?FIRST_PILOT_TROUBLESHOOTING\.md`?\]\([^)]+\)/gi,
      "[Troubleshooting](/help/troubleshooting)",
    )
    .replace(/`?BUYER_FIRST_30_MINUTES\.md`?/gi, "buyer first session guide")
    .replace(/`?SECOND_RUN\.md`?/gi, "second review guide")
    .replace(/`?FIRST_PILOT_OPERATOR_PATH\.md`?/gi, "complete review workflow")
    .replace(/`?FIRST_PILOT_TROUBLESHOOTING\.md`?/gi, "troubleshooting guide")
    .replace(/\n{3,}/g, "\n\n");
}
