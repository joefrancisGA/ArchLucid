import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";
import {
  isDocumentationMaintenanceMetadataLine,
  prepareHelpMarkdownForPresentation,
} from "@/lib/help-markdown-presentation";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";

const COMPLETE_REVIEW_WORKFLOW_PATH = join(
  process.cwd(),
  "..",
  "docs",
  "library",
  "customer-facing",
  "COMPLETE_REVIEW_WORKFLOW.md",
);

/** Customer-facing complete review workflow must not leak internal runbook or operator jargon. */
const COMPLETE_REVIEW_WORKFLOW_BANNED_PHRASES: readonly string[] = [
  "pilot deployment",
  "deep-default shell",
  "operator status",
  "smoke test",
  "phase a",
  "phase b",
  "runbook",
  "v1.1",
  "localhost",
  "last reviewed",
  "doc owner",
  "maintainer",
  "pilot strict",
  "proof packet",
  "archlucid pilot",
] as const;

function readCompleteReviewWorkflowMarkdown(): string {
  return readFileSync(COMPLETE_REVIEW_WORKFLOW_PATH, "utf8");
}

describe("complete review workflow help copy guard", () => {
  it("registers first-pilot-path as buyer-facing product help", () => {
    const entry = getProductDocumentationEntry("first-pilot-path");

    expect(entry).not.toBeUndefined();
    expect(entry?.audience).toBe("buyer");
    expect(entry?.title).toBe("Complete review workflow");
    expect(entry?.sourcePaths[0]).toContain("COMPLETE_REVIEW_WORKFLOW.md");
  });

  it("keeps customer workflow body free of internal operator and runbook phrases", () => {
    const normalized = readCompleteReviewWorkflowMarkdown().toLowerCase();
    const violations = COMPLETE_REVIEW_WORKFLOW_BANNED_PHRASES.filter((phrase) => normalized.includes(phrase));

    expect(violations).toEqual([]);
  });

  it("uses lifecycle step headings instead of markdown horizontal rules", () => {
    const source = readCompleteReviewWorkflowMarkdown();

    expect(source.split("\n").some((line) => /^---\s*$/.test(line.trim()))).toBe(false);
    expect(source).toContain("## Step 1: Create a review package");
    expect(source).toContain("## Step 6: Export and share artifacts");
    expect(source).toContain("## Review states");
    expect(source).toContain("## Related help");
  });

  it("includes the customer-facing intro sentence", () => {
    const text = readCompleteReviewWorkflowMarkdown();

    expect(text).toContain(
      "ArchLucid turns architecture evidence into a review package with findings, decisions, evidence traceability, and export-ready artifacts.",
    );
  });

  it("hides maintenance metadata when prepared for buyer help presentation", () => {
    const loaded = tryLoadProductDocumentation("first-pilot-path");

    expect(loaded).not.toBeNull();

    const sourcePath = loaded!.entry.sourcePaths[0] ?? "";
    const prepared = prepareHelpMarkdownForPresentation(loaded!.markdown, sourcePath);
    const maintenanceLines = prepared
      .split("\n")
      .filter((line) => isDocumentationMaintenanceMetadataLine(line));

    expect(maintenanceLines).toEqual([]);
    expect(prepared.toLowerCase()).not.toContain("last reviewed");
  });
});
