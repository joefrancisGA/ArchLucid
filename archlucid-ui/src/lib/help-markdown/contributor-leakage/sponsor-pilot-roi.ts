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
  extractFirstValue20MinutesSection,
  stripFirstValue20ExtractedSectionHeading,
  replaceFirstValue20OutsideBacktickSpans,
  applyFirstValue20ProseLeakageReplacements,
  applyFirstValue20CodeSpanLeakageReplacements,
  PILOT_FEEDBACK_OMITTED_SECTION_PREFIXES,
  isPilotFeedbackContributorLeakageLine
} from "./internal";
import { stripProductOverviewContributorLeakage } from "./policy-and-misc";
export function stripSponsorReportPilotRoiMeasurementLeakage(markdown: string): string {
  let inFence = false;

  const withoutSensitiveRows = markdown
    .split("\n")
    .filter((line) => {
      const trimmedStart = line.trimStart();

      // Earlier sponsor-brief email templates use fenced blocks; reset at H2 so folded
      // scorecard sections are not treated as still inside a code fence.
      if (/^##\s+/.test(trimmedStart)) {
        inFence = false;
      }

      if (trimmedStart.startsWith("```")) {
        inFence = !inFence;
        return true;
      }

      if (inFence) {
        return true;
      }

      if (/Former standalone(?: body)?:/i.test(line)) {
        return false;
      }

      if (/path-stable alias for product\/ci strings/i.test(line)) {
        return false;
      }

      if (/Conservative value from\s+.+\boptions\b/i.test(line)) {
        return false;
      }

      if (/START_HERE\.md/i.test(line)) {
        return false;
      }

      if (/V1_SCOPE\.md/i.test(line)) {
        return false;
      }

      if (/CORE_PILOT\.md/i.test(line)) {
        return false;
      }

      if (/REPOSITORY_README/i.test(line)) {
        return false;
      }

      if (/archive\/gtm-internal/i.test(line)) {
        return false;
      }

      if (/OPERATOR_DECISION_GUIDE/i.test(line)) {
        return false;
      }

      if (/PRODUCT_PACKAGING/i.test(line)) {
        return false;
      }

      if (/PMF tracker/i.test(line)) {
        return false;
      }

      if (/CLI copy/i.test(line) && /CI strings/i.test(line)) {
        return false;
      }

      if (/docs\/go-to-market\/validation\//i.test(line)) {
        return false;
      }

      return true;
    })
    .join("\n");

  const softened = withoutSensitiveRows
    .replace(/\s*\(TB-\d+\)/gi, "")
    .replace(/\bTB-\d+\b/gi, "")
    .replace(/`?START_HERE\.md`?/gi, "product documentation index")
    .replace(/`?V1_SCOPE\.md`?/gi, "product scope")
    .replace(/`?CORE_PILOT\.md`?/gi, "Your first architecture review")
    .replace(/`?REPOSITORY_README`?/gi, "repository overview")
    .replace(/`?OPERATOR_DECISION_GUIDE\.md`?/gi, "deployment decision guide")
    .replace(/`?PRODUCT_PACKAGING\.md`?/gi, "product packaging guide")
    .replace(
      /`?SPONSOR_BRIEF\.md`?/gi,
      "[Sponsor report](/help/sponsor-report)",
    )
    .replace(/SPONSOR_BRIEF\.md/gi, "/help/sponsor-report")
    .replace(
      /`?PILOT_ROI_MODEL\.md`?/gi,
      "[Pilot ROI measurement](/help/sponsor-report#pilot-roi-measurement)",
    )
    .replace(/PILOT_ROI_MODEL\.md/gi, "/help/sponsor-report#pilot-roi-measurement")
    .replace(
      /`?ROI_MODEL\.md`?/gi,
      "[Pilot ROI measurement](/help/sponsor-report#pilot-roi-measurement)",
    )
    .replace(/ROI_MODEL\.md/gi, "/help/sponsor-report#pilot-roi-measurement")
    .replace(/`?docs\/go-to-market\/[^`\s)]+`?/gi, "go-to-market documentation")
    .replace(/docs\/go-to-market\/[^\s)]+/gi, "go-to-market documentation")
    .replace(/`?docs\/library\/[^`\s)]+`?/gi, "product documentation")
    .replace(/docs\/library\/[^\s)]+/gi, "product documentation")
    .replace(/\bPilot Roi Model options\b/gi, "pilot ROI methodology options")
    .replace(/\bPilot Roi Model\b/gi, "pilot ROI methodology")
    .replace(/\bCore Pilot\b/g, "Your first architecture review")
    .replace(
      /## Pilot ROI measurement \{#pilot-roi-measurement\}/i,
      "## Sponsor ROI methodology {#pilot-roi-measurement}",
    )
    .replace(
      /\*\*Create review → Execute → Finalize → Review artifacts\*\*\s*\n?\(API\/CLI may still say \*\*commit\*\*[^)]*\)/gi,
      "**Request → finalize → review exports** — use product surfaces; engineering status names stay out of sponsor narratives.",
    )
    .replace(/`ReadyForCommit`/gi, "ready to finalize")
    .replace(/\bReadyForCommit\b/g, "ready to finalize")
    .replace(/\n{3,}/g, "\n\n");

  return wrapPilotRoiMeasurementDenseSectionsInDetails(softened);
}

function wrapPilotRoiMeasurementDenseSectionsInDetails(markdown: string): string {
  let result = markdown;

  result = result.replace(
    /(#### Secondary pilot metrics[\s\S]*?)(?=\n### |\n## |$)/i,
    '<details data-testid="pilot-roi-measurement-secondary-metrics">\n<summary>Secondary pilot metrics</summary>\n\n$1\n</details>\n\n',
  );

  result = result.replace(
    /(### Suggested pilot scorecard \(1.5\)[\s\S]*?)(?=\n### |\n## |$)/i,
    '<details data-testid="pilot-roi-measurement-scorecard">\n<summary>Suggested pilot scorecard (1–5)</summary>\n\n$1\n</details>\n\n',
  );

  return result;
}
export function stripPilotRoiModelContributorLeakage(markdown: string): string {
  return stripSponsorReportPilotRoiMeasurementLeakage(markdown);
}
export function stripSponsorReportContributorLeakage(markdown: string): string {
  let result = markdown
    .replace(
      /\*\*How do I try it locally\?\*\*[\s\S]*?(?=\n\n\*\*|\n## |\n---\n|$)/i,
      [
        "**How do I evaluate ArchLucid?**",
        "Start a guided pilot or first architecture review — see [Your first architecture review](/help/first-architecture-review).",
      ].join("\n"),
    )
    .replace(/`?day-one-developer\.md`?/gi, "[Getting started](/help/first-architecture-review)")
    .replace(/day-one-developer\.md/gi, "/help/first-architecture-review")
    .replace(/\*\*ArchLucid\.Api\*\*/g, "the hosted service")
    .replace(/`?archlucid-ui`?/gi, "the web application")
    .replace(/`?FIRST_REAL_VALUE\.md`?/gi, "deployment configuration documentation")
    .replace(/FIRST_REAL_VALUE\.md/gi, "deployment configuration documentation")
    .replace(/`?V1_SCOPE\.md`?/gi, "[Procurement FAQ](/help/procurement)")
    .replace(/V1_SCOPE\.md/gi, "/help/procurement")
    .replace(/`?SECURITY\.md`?/gi, "[Security and trust](/help/security-trust)")
    .replace(/contributor-reference\/SECURITY\.md/gi, "/help/security-trust")
    .replace(/`?MULTI_TENANT_RLS\.md`?/gi, "[Data handling and tenant isolation](/help/data-handling)")
    .replace(/MULTI_TENANT_RLS\.md/gi, "/help/data-handling")
    .replace(/`?ArchLucid\.Contracts`?/gi, "versioned API contracts")
    .replace(/ArchLucid\.Contracts/gi, "versioned API contracts")
    .replace(/\(\*\*TB-\d+\*\*\)/gi, "")
    .replace(/\*\*TB-\d+\*\*/gi, "enterprise OAuth upgrades")
    .replace(/\bTB-\d+\b/gi, "enterprise integration upgrades")
    .replace(/`?INTEGRATION_CATALOG\.md`?/gi, "[Integrations hub](/integrations)")
    .replace(/INTEGRATION_CATALOG\.md/gi, "/integrations")
    .replace(/`?PRICING_PHILOSOPHY\.md`?/gi, "[Procurement FAQ](/help/procurement)")
    .replace(/PRICING_PHILOSOPHY\.md/gi, "/help/procurement")
    .replace(/`?CONCEPT_VOCABULARY\.md`?/gi, "product terminology guide")
    .replace(/CONCEPT_VOCABULARY\.md/gi, "product terminology guide")
    .replace(/via CLI \(see[^)]+\)/gi, "from the product (see [Troubleshooting](/help/troubleshooting))")
    .replace(/`GET \/version`/gi, "version information")
    .replace(/`X-Correlation-ID`/gi, "correlation identifier")
    .replace(/row-level security/gi, "tenant isolation controls");

  result = result.replace(
    /\*\*Where does tenant data live\?\*\*[\s\S]*?(?=\n\n\*\*|\n## |\n---\n|$)/i,
    [
      "**Where does tenant data live?**",
      "Hosted deployments use Azure-native storage and SQL with dedicated tenant catalogs. See [Data handling and tenant isolation](/help/data-handling) and [Security and trust](/help/security-trust).",
    ].join("\n"),
  );

  return result.replace(/\n{3,}/g, "\n\n").trimEnd();
}
export function stripFirstValue20ContributorLeakage(markdown: string): string {
  const focused = extractFirstValue20MinutesSection(markdown);
  const withoutSectionHeading = stripFirstValue20ExtractedSectionHeading(focused);
  const withoutMojibake = withoutSectionHeading
    .replace(/Â§/g, "§")
    .replace(/Â/g, "")
    .replace(
      /For the full phased checklist, continue with §?\s*\*\*Phase A\*\* below\./gi,
      "Use this section when the platform is already wired — not the full phased first-pilot checklist.",
    )
    .replace(/continue with §?\s*\*\*Phase A\*\* below/gi, "use this time-boxed section");

  const sanitized = replaceFirstValue20OutsideBacktickSpans(
    withoutMojibake,
    applyFirstValue20ProseLeakageReplacements,
    applyFirstValue20CodeSpanLeakageReplacements,
  );

  return sanitized.replace(/\n{3,}/g, "\n\n").trimEnd();
}
export function stripPilotFeedbackContributorSections(markdown: string): string {
  return stripMarkdownSectionsByTitlePrefix(markdown, PILOT_FEEDBACK_OMITTED_SECTION_PREFIXES);
}
export function stripPilotFeedbackContributorLeakage(markdown: string): string {
  const sectionStripped = stripPilotFeedbackContributorSections(markdown);
  const lines = sectionStripped.split("\n");
  const result: string[] = [];
  let inFence = false;
  let fenceBuffer: string[] = [];
  let detailsBuffer: string[] | null = null;

  const flushFenceBuffer = (): void => {
    if (fenceBuffer.length === 0) {
      return;
    }

    const block = fenceBuffer.join("\n");
    fenceBuffer = [];

    if (/\/v1\/|product-learning|PlanningBridgePanel/i.test(block)) {
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
      if (inFence) {
        fenceBuffer.push(line);
        flushFenceBuffer();
        inFence = false;
        continue;
      }

      inFence = true;
      fenceBuffer = [line];
      continue;
    }

    if (inFence) {
      fenceBuffer.push(line);
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

    if (/Rows are stored in \*\*`ProductLearningPilotSignals`/i.test(line)) {
      result.push(
        "- Signals are stored per **tenant**, **workspace**, and **project** — the same scope shown in your workspace shell.",
      );
      continue;
    }

    if (isPilotFeedbackContributorLeakageLine(line)) {
      continue;
    }

    if (/^\|\s*[-:| ]+\|\s*$/i.test(trimmed)) {
      continue;
    }

    if (/Sign in to the workspace UI \(local:/i.test(line)) {
      result.push(
        "1. Sign in to the workspace UI.",
      );
      continue;
    }

    result.push(line);
  }

  flushFenceBuffer();

  return result
    .join("\n")
    .replace(/`?ProductLearningPilotSignals`?/gi, "pilot feedback signals")
    .replace(/`ArchLucid:StorageProvider`/gi, "configured storage")
    .replace(/`Sql`/gi, "database")
    .replace(
      /- \*\*`POST \/v1\/learning\/planning\/materialize`\*\*[^.\n]*\./gi,
      "- Use the **Planning bridge** on **Pilot feedback** to materialize draft themes and plans from ranked opportunities.",
    )
    .replace(
      // Static pattern — avoid string→RegExp escape helpers that CodeQL flags as js/incomplete-sanitization.
      /- \*\*Operator\s+shell \(V1 GA\):\*\* \*\*`PlanningBridgePanel`\*\* on \*\*`\/(?:internal\/)?product-learning`\*\*[^\.\n]*\./gi,
      "- Open **Q&A & advisory** → **Pilot feedback**, then use the **Planning bridge** panel to create draft improvement themes and plans.",
    )
    .replace(/\*\*ExecuteAuthority\*\*/gi, "appropriate admin permission")
    .replace(
      /(## 4\.1[^\n]*\n\nWhen you want[^\n]*:\n\n)/i,
      "$1- Open **Q&A & advisory** → **Pilot feedback** (`/internal/product-learning`), then use the **Planning bridge** panel to materialize draft themes and plans from ranked opportunities.\n",
    )
    .replace(/\s*\(58R\)/gi, "")
    .replace(/\s*\(59R\)/gi, "")
    .replace(/\bin 58R\b/gi, "in pilot feedback")
    .replace(/\n{3,}/g, "\n\n")
    .trimEnd();
}
export function stripSponsorReportSponsorBriefLeakage(markdown: string): string {
  return stripProductOverviewContributorLeakage(markdown)
    .replace(/^(##+)\s+\d+\.\s+/gm, "$1 ")
    .replace(/`?API_CONTRACTS\.md`?/gi, "[API contracts](/help/api-contracts)")
    .replace(/API_CONTRACTS\.md/gi, "/help/api-contracts")
    .replace(
      /`?PILOT_ROI_MODEL\.md`?/gi,
      "[Pilot ROI measurement](/help/sponsor-report#pilot-roi-measurement)",
    )
    .replace(/PILOT_ROI_MODEL\.md/gi, "/help/sponsor-report#pilot-roi-measurement")
    .replace(
      /`?ROI_MODEL\.md`?/gi,
      "[Pilot ROI measurement](/help/sponsor-report#pilot-roi-measurement)",
    )
    .replace(/ROI_MODEL\.md/gi, "/help/sponsor-report#pilot-roi-measurement")
    .replace(/\[Api Contracts\]\(/gi, "[API contracts](")
    .replace(/\[Pilot Roi Model\]\(/gi, "[Pilot ROI measurement](")
    .replace(/\[Roi Model\]\(/gi, "[Pilot ROI measurement](")
    .replace(/`?PRODUCT_PACKAGING\.md`?/gi, "[Sponsor report](/help/sponsor-report#what-archlucid-is)")
    .replace(/PRODUCT_PACKAGING\.md/gi, "/help/sponsor-report#what-archlucid-is")
    .replace(/`\/value-report`/gi, "`/insights/sponsor-report`")
    .replace(/\/value-report/gi, "/insights/sponsor-report")
    .replace(/\/help\/pilot-roi-model/gi, "/help/sponsor-report#pilot-roi-measurement")
    .replace(/`?SPONSOR_BANNER_FIRST_COMMIT_BADGE\.md`?/gi, "sponsor banner documentation")
    .replace(/SPONSOR_BANNER_FIRST_COMMIT_BADGE\.md/gi, "sponsor banner documentation");
}
