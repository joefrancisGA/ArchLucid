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
  REPEAT_REVIEW_LOOP_OMITTED_SECTION_PREFIXES,
  ACCELERATOR_CHOOSER_OMITTED_SECTION_PREFIXES
} from "./internal";
export function stripRepeatReviewLoopContributorSections(markdown: string): string {
  return stripMarkdownSectionsByTitlePrefix(markdown, REPEAT_REVIEW_LOOP_OMITTED_SECTION_PREFIXES);
}
export function stripRepeatReviewLoopContributorLeakage(markdown: string): string {
  const lines = markdown.split("\n");
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

    if (/collect-first-pilot-proof/i.test(block) || /archlucid second-run/i.test(block)) {
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

    if (/^\*\*Habit-loop validation:\*\*/i.test(trimmed)) {
      continue;
    }

    if (/^\*\*Audience:\*\*/i.test(trimmed)) {
      continue;
    }

    if (/^\*\*Prerequisite:\*\*/i.test(trimmed)) {
      continue;
    }

    if (/SECOND_REVIEW_HABIT_LOOP_VALIDATION/i.test(line)) {
      continue;
    }

    if (/fixtures\/second-review/i.test(line)) {
      continue;
    }

    if (/THREE_REAL_MODE_PROOF_RUNS/i.test(line)) {
      continue;
    }

    if (/GENERIC_AI_BAKEOFF_PROTOCOL/i.test(line)) {
      continue;
    }

    if (/PRODUCT_LEARNING/i.test(line)) {
      continue;
    }

    if (/API_CONTRACTS/i.test(line)) {
      continue;
    }

    if (/CORE_PILOT\.md/i.test(line)) {
      continue;
    }

    if (/PRODUCT_PACKAGING/i.test(line)) {
      continue;
    }

    if (/collect-first-pilot-proof/i.test(line)) {
      continue;
    }

    if (/^-\s+\[[xX ]\]\s+/i.test(trimmedStart)) {
      result.push(trimmedStart.replace(/^-\s+\[[xX ]\]\s+/, "- "));
      continue;
    }

    if (/\.\/scripts\//i.test(line)) {
      continue;
    }

    if (/second-review-habit-loop-validation/i.test(line)) {
      continue;
    }

    result.push(line);
  }

  if (inFence) {
    flushFenceBuffer();
  }

  return result
    .join("\n")
    .replace(/\s*\(TB-\d+\)/gi, "")
    .replace(/\bTB-\d+\b/gi, "")
    .replace(/\]\(\/help\/core-pilot\)/gi, "](/help/first-architecture-review)")
    .replace(/`?CORE_PILOT\.md`?/gi, "Your first architecture review")
    .replace(/`?API_CONTRACTS\.md`?/gi, "API contracts reference")
    .replace(/`?PRODUCT_LEARNING\.md`?/gi, "product learning analytics")
    .replace(/`?PRODUCT_PACKAGING\.md`?/gi, "product packaging guide")
    .replace(/`?PILOT_ROI_MODEL\.md`?/gi, "pilot ROI methodology")
    .replace(/`?DEFAULT_POLICY_PACKS_V1\.md`?/gi, "default policy packs")
    .replace(/`?PILOT_SUCCESS_SCORECARD\.md`?/gi, "pilot success scorecard")
    .replace(/`?docs\/go-to-market\/[^`\s)]+`?/gi, "go-to-market documentation")
    .replace(/docs\/go-to-market\/[^\s)]+/gi, "go-to-market documentation")
    .replace(/`?docs\/library\/[^`\s)]+`?/gi, "product documentation")
    .replace(/docs\/library\/[^\s)]+/gi, "product documentation")
    .replace(/`?docs\/runbooks\/[^`\s)]+`?/gi, "operations runbook")
    .replace(/docs\/runbooks\/[^\s)]+/gi, "operations runbook")
    .replace(/\n{3,}/g, "\n\n");
}
export function stripAcceleratorChooserIntroAndTable(markdown: string): string {
  const lines = markdown.split("\n");
  const result: string[] = [];
  let inTable = false;
  let pastChooserBody = false;

  for (const line of lines) {
    if (line.startsWith("### How to start") || line.startsWith("**Out of scope")) {
      pastChooserBody = true;
      inTable = false;
    }

    // GTM/V1.1 roadmap caveats stay in DEMO_QUICKSTART — not in-app buyer help.
    if (line.startsWith("**Out of scope")) {
      continue;
    }

    if (!pastChooserBody) {
      if (line.startsWith("## ") && !line.startsWith("###")) {
        continue;
      }

      if (/Former standalone body/i.test(line)) {
        continue;
      }

      if (/Path-stable alias/i.test(line)) {
        continue;
      }

      if (/CI pack-tree twin/i.test(line)) {
        continue;
      }

      if (/^\*\*Last reviewed:\*\*/i.test(line)) {
        continue;
      }

      if (/ACCELERATOR_CHOOSER/i.test(line)) {
        continue;
      }

      if (/templates\/starter-proof-packs/i.test(line)) {
        continue;
      }

      if (/no new templates/i.test(line)) {
        continue;
      }

      if (line.trim().length === 0) {
        if (!inTable) {
          continue;
        }

        inTable = false;
        continue;
      }

      if (line.trimStart().startsWith("|")) {
        inTable = true;
        continue;
      }

      if (inTable) {
        continue;
      }

      continue;
    }

    if (line.trimStart().startsWith("|")) {
      inTable = true;
      continue;
    }

    if (inTable && line.trim().length === 0) {
      inTable = false;
      continue;
    }

    if (inTable) {
      continue;
    }

    if (line.startsWith("### How to start in the architect workspace")) {
      continue;
    }

    result.push(line);
  }

  return result.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}
export function stripAcceleratorChooserContributorSections(markdown: string): string {
  return stripMarkdownSectionsByTitlePrefix(markdown, ACCELERATOR_CHOOSER_OMITTED_SECTION_PREFIXES, {
    headingLevels: [2, 3],
    // Buyer help must not surface GTM deferred-scope / V1.1 roadmap inventory.
    dropLinesStartingWith: ["**Out of scope"],
    keepLinesContaining: ["/help/first-architecture-review"],
  });
}
export function stripAcceleratorChooserContributorLeakage(markdown: string): string {
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

      if (/POLICY_PACK_/i.test(line)) {
        return false;
      }

      if (/DEFAULT_POLICY_PACKS_V1/i.test(line)) {
        return false;
      }

      if (/STARTER_PROOF_PACK_CHOOSER/i.test(line)) {
        return false;
      }

      if (/walkthroughs\//i.test(line)) {
        return false;
      }

      if (/GOLDEN_ACCELERATOR_WALKTHROUGH/i.test(line)) {
        return false;
      }

      return true;
    })
    .join("\n");

  return withoutSensitiveRows
    .replace(/\s*\(TB-\d+\)/gi, "")
    .replace(/\bTB-\d+\b/gi, "")
    .replace(/`?templates\/starter-proof-packs\/?`?/gi, "in-product accelerator packs")
    .replace(/templates\/starter-proof-packs\/?/gi, "in-product accelerator packs")
    .replace(/`?POLICY_PACK_[A-Z0-9_]+\.md`?/gi, "policy pack documentation")
    .replace(/POLICY_PACK_[A-Z0-9_]+\.md/gi, "policy pack documentation")
    .replace(/`?DEFAULT_POLICY_PACKS_V1\.md`?/gi, "default policy packs")
    .replace(/DEFAULT_POLICY_PACKS_V1\.md/gi, "default policy packs")
    .replace(/`?STARTER_PROOF_PACK_CHOOSER\.md`?/gi, "accelerator pack chooser")
    .replace(/STARTER_PROOF_PACK_CHOOSER\.md/gi, "accelerator pack chooser")
    .replace(/`?walkthroughs\/[^`\s)]+`?/gi, "product walkthrough")
    .replace(/walkthroughs\/[^\s)]+/gi, "product walkthrough")
    .replace(/`?starter-pack\.json`?/gi, "pack manifest")
    .replace(/starter-pack\.json/gi, "pack manifest")
    .replace(/`?ACCELERATOR_CHOOSER\.md`?/gi, "accelerator pack chooser")
    .replace(/ACCELERATOR_CHOOSER\.md/gi, "accelerator pack chooser")
    .replace(/from the pack folder/gi, "when starting the review")
    .replace(/in the pack folder/gi, "with the review")
    .replace(/\n{3,}/g, "\n\n");
}
export function stripPriorManifestRetrievalContributorLeakage(markdown: string): string {
  const lines = markdown.split("\n");
  const result: string[] = [];
  let detailsBuffer: string[] | null = null;

  for (const line of lines) {
    const trimmed = line.trim();

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

    if (/Retrieval:PriorManifest/i.test(line)) {
      continue;
    }

    if (/MaxPriorManifestsPerIndex/i.test(line)) {
      continue;
    }

    if (/deployment configuration/i.test(line)) {
      continue;
    }

    if (/Administrator details — indexing limits/i.test(line)) {
      continue;
    }

    if (/Platform teams may adjust the limit/i.test(line)) {
      continue;
    }

    result.push(line);
  }

  return result
    .join("\n")
    .replace(
      new RegExp(
        "up to the configured limit of \\*\\*other finalized " +
          ["arch", "itecture packages"].join("") +
          "\\*\\*",
        "gi",
      ),
      "up to **five** other finalized reviews (most recent first)",
    )
    .replace(/\(see limits below\)/gi, "")
    .replace(
      /Cross-package prior attachment at index time is capped[^.\n]*\./gi,
      "Cross-package prior attachment keeps the **five** most recent finalized reviews in the same project, excluding the review being finalized and any archived records.",
    )
    .replace(/`Retrieval:PriorManifest:[^`]+`/gi, "the platform indexing limit")
    .replace(/Retrieval:PriorManifest:[^\s)]+/gi, "the platform indexing limit")
    .replace(/\n{3,}/g, "\n\n")
    .trimEnd();
}
