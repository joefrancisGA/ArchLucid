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
  POLICY_PACK_DELTA_OMITTED_SECTION_PREFIXES,
  isPolicyPackDeltaContributorLeakageLine,
  isProductOverviewContributorLeakageLine
} from "./internal";
export function stripPolicyPackDeltaContributorSections(markdown: string): string {
  return stripMarkdownSectionsByTitlePrefix(markdown, POLICY_PACK_DELTA_OMITTED_SECTION_PREFIXES);
}
export function stripPolicyPackDeltaContributorLeakage(markdown: string): string {
  const sectionStripped = stripPolicyPackDeltaContributorSections(markdown);
  const lines = sectionStripped.split("\n");
  const result: string[] = [];
  let inFence = false;
  let fenceBuffer: string[] = [];
  let fenceLanguage = "";
  let omitApiSubsection = false;

  const flushFenceBuffer = (): void => {
    if (fenceBuffer.length === 0) {
      return;
    }

    const block = fenceBuffer.join("\n");
    fenceBuffer = [];

    if (/^```http/i.test(block) || /\/v1\//i.test(block) || /demo-policy-pack-delta/i.test(block)) {
      return;
    }

    for (const bufferedLine of block.split("\n")) {
      result.push(bufferedLine);
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    const trimmedStart = line.trimStart();

    if (/^### API\b/i.test(trimmed)) {
      omitApiSubsection = true;
      continue;
    }

    if (/^### /i.test(trimmed)) {
      omitApiSubsection = false;
    }

    if (omitApiSubsection) {
      continue;
    }

    if (trimmedStart.startsWith("```")) {
      if (inFence) {
        fenceBuffer.push(line);
        flushFenceBuffer();
        inFence = false;
        fenceLanguage = "";
        continue;
      }

      inFence = true;
      fenceLanguage = trimmedStart.slice(3).trim().toLowerCase();
      fenceBuffer = [line];

      if (fenceLanguage === "http" || fenceLanguage === "powershell") {
        fenceBuffer = [];
        inFence = true;
        continue;
      }

      continue;
    }

    if (inFence) {
      if (fenceLanguage === "http" || fenceLanguage === "powershell") {
        if (trimmedStart.startsWith("```")) {
          inFence = false;
          fenceLanguage = "";
        }

        continue;
      }

      fenceBuffer.push(line);
      continue;
    }

    if (isPolicyPackDeltaContributorLeakageLine(line)) {
      continue;
    }

    if (/^\| \*\*Committed run\*\*/i.test(line)) {
      result.push(
        "| **Committed run** | A finalized architecture review with a findings snapshot (demo workspace or your pilot run). |",
      );
      continue;
    }

    if (/^\| \*\*Scope headers\*\*/i.test(line)) {
      continue;
    }

    result.push(line);
  }

  flushFenceBuffer();

  return result
    .join("\n")
    .replace(/\b[a-f0-9]{32}\b/gi, "a-committed-review-run-id")
    .replace(/`eb81dd4972ad429e8d4e214f9934bfc0`/gi, "a committed review run id")
    .replace(/`?\{runId\}`?/gi, "the review run")
    .replace(/`?\{tenantId\}`?/gi, "your tenant")
    .replace(/`?\{workspaceId\}`?/gi, "your workspace")
    .replace(/`?\{projectId\}`?/gi, "your project")
    .replace(/`?\{token\}`?/gi, "your session")
    .replace(/`?\{policyPackId\}`?/gi, "the policy pack")
    .replace(/#governance-pre-commit-blocked/gi, "governance pre-commit block")
    .replace(/\n{3,}/g, "\n\n")
    .trimEnd();
}
export function stripProductOverviewContributorLeakage(markdown: string): string {
  const lines = markdown.split("\n");
  const result: string[] = [];
  let detailsBuffer: string[] | null = null;
  let omitM18Templates = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (/^### M-18 outreach message templates/i.test(trimmed)) {
      omitM18Templates = true;
      continue;
    }

    if (omitM18Templates && /^## /i.test(trimmed)) {
      omitM18Templates = false;
    }

    if (omitM18Templates) {
      continue;
    }

    if (/^<details\b/i.test(trimmed)) {
      detailsBuffer = [line];
      continue;
    }

    if (detailsBuffer !== null) {
      detailsBuffer.push(line);

      if (/^<\/details>/i.test(trimmed)) {
        detailsBuffer = null;
      }

      continue;
    }

    if (isProductOverviewContributorLeakageLine(line)) {
      continue;
    }

    if (/^\*\*Platform intent:\*\*/i.test(trimmed)) {
      result.push(
        "**Platform intent:** Production reference deployments and first-party operations are **Azure-native** (identity, data, messaging, and hosting). Hosted evaluation uses the public ArchLucid SaaS endpoints when your tenant is provisioned.",
      );
      continue;
    }

    result.push(line);
  }

  return result
    .join("\n")
    .replace(
      /Every architecture recommendation ArchLucid produces comes with a complete chain of evidence\.[\s\S]*?and here is the full trail\./i,
      "Every architecture recommendation ArchLucid produces comes with a complete chain of evidence: what was examined, which rules applied, what was concluded, and why — linked to review artifacts, not a chat transcript.",
    )
    .replace(
      /Architecture decisions in ArchLucid are not just analyzed — they are governed\.[\s\S]*?regulators and auditors expect\./i,
      "Architecture decisions in ArchLucid are not just analyzed — they are governed. **Policy packs** encode your governance rules. Approval workflows enforce segregation of duties. Pre-finalize gates can block finalized reviews when findings exceed severity thresholds. An append-only audit log records governance and review events for downstream audit.",
    )
    .replace(/`?POSITIONING\.md`?/gi, "positioning guide")
    .replace(/POSITIONING\.md/gi, "positioning guide")
    .replace(/`?V1_DEFERRED\.md`?/gi, "deferred capability documentation")
    .replace(/V1_DEFERRED\.md/gi, "deferred capability documentation")
    .replace(/ExplainabilityTrace/gi, "explainability trail")
    .replace(/\bM-\d+\b/gi, "")
    .replace(/open\s+\*\*\*\*/gi, "")
    .replace(/GTM\s+\*\*\*\*/gi, "go-to-market planning")
    .replace(/\n{3,}/g, "\n\n")
    .trimEnd();
}
