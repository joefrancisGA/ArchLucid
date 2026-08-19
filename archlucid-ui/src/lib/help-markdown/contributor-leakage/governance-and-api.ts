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
  GOVERNANCE_API_CONTRACTS_OMITTED_SECTION_PREFIXES
} from "./internal";
export function stripGovernanceApiContractsContributorSections(markdown: string): string {
  return stripMarkdownSectionsByTitlePrefix(markdown, GOVERNANCE_API_CONTRACTS_OMITTED_SECTION_PREFIXES);
}
export function stripGovernanceApiContractsContributorLeakage(markdown: string): string {
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

      if (/OpenApiContractSnapshotTests/i.test(line)) {
        return false;
      }

      if (/OpenApiBuyerContractSnapshotTests/i.test(line)) {
        return false;
      }

      if (/ARCHLUCID_UPDATE_OPENAPI_SNAPSHOT/i.test(line)) {
        return false;
      }

      if (/ARCHLUCID_UPDATE_BUYER_OPENAPI_SNAPSHOT/i.test(line)) {
        return false;
      }

      if (/ArchLucid\.Api\.Tests\/Contracts/i.test(line)) {
        return false;
      }

      if (/contracts\/bruno/i.test(line)) {
        return false;
      }

      if (/\bscripts\/(ci|v1-integration)/i.test(line)) {
        return false;
      }

      if (/docs\/runbooks\//i.test(line)) {
        return false;
      }

      if (/Integration starter fixtures/i.test(line)) {
        return false;
      }

      if (/v1-integration-correctness-drill/i.test(line)) {
        return false;
      }

      if (/npm run generate:api-types/i.test(line)) {
        return false;
      }

      if (/assert_api_types_in_sync/i.test(line)) {
        return false;
      }

      if (/Generated\/ArchLucidApiClient\.g\.cs/i.test(line)) {
        return false;
      }

      if (/OPENAPI_CONTRACT_DRIFT\.md/i.test(line)) {
        return false;
      }

      if (/archlucid reference-evidence/i.test(line)) {
        return false;
      }

      return true;
    })
    .join("\n");

  return withoutSensitiveRows
    .replace(/\s*\(TB-\d+\)/gi, "")
    .replace(/\bTB-\d+\b/gi, "")
    .replace(/`?START_HERE\.md`?/gi, "product documentation index")
    .replace(/START_HERE\.md/gi, "product documentation index")
    .replace(/`?ArchLucid\.Api\/[^`\s)]+`?/gi, "API host configuration")
    .replace(/ArchLucid\.Api\/[^\s)]+/gi, "API host configuration")
    .replace(/`?docs\/operator-shell\.md`?/gi, "operator console documentation")
    .replace(/docs\/operator-shell\.md/gi, "operator console documentation")
    .replace(/`?scripts\/[^`\s)]+`?/gi, "integration validation checks")
    .replace(/\bscripts\/[^\s)]+/gi, "integration validation checks")
    .replace(/`?docs\/runbooks\/[^`\s)]+`?/gi, "operations runbook")
    .replace(/docs\/runbooks\/[^\s)]+/gi, "operations runbook")
    .replace(/`?contracts\/bruno\/[^`\s)]*`?/gi, "API smoke collection")
    .replace(/contracts\/bruno\/[^\s)]*/gi, "API smoke collection")
    .replace(/`?ArchLucid\.Api\.Client`?/gi, "generated API client")
    .replace(/\bArchLucid\.Api\.Client\b/gi, "generated API client")
    .replace(/\n{3,}/g, "\n\n");
}
