import { describe, expect, it } from "vitest";

import {
  isDocumentationMaintenanceMetadataLine,
  prepareHelpMarkdownForPresentation,
} from "@/lib/help-markdown-presentation";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";
import {
  getProductDocumentationEntry,
  inAppHelpHref,
  normalizeHelpTopicSlug,
} from "@/lib/product-documentation-registry";

/** Customer-facing Core Pilot body must not leak internal runbook or operator jargon. */
const CORE_PILOT_BANNED_PHRASES: readonly string[] = [
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

/**
 * TB-1379: first-pilot-path / COMPLETE_REVIEW_WORKFLOW folded into Your first architecture review.
 */
describe("complete review workflow → Core Pilot (TB-1379)", () => {
  const aliasSlug = "first-pilot-path";
  const canonicalSlug = "first-architecture-review";

  it("aliases first-pilot-path to first-architecture-review", () => {
    expect(normalizeHelpTopicSlug(aliasSlug)).toBe(canonicalSlug);

    const entry = getProductDocumentationEntry(aliasSlug);

    expect(entry?.slug).toBe(canonicalSlug);
    expect(entry?.title).toBe("Your first architecture review");
    expect(entry?.audience).toBe("buyer");
    expect(entry?.sourcePaths).toEqual(["docs/CORE_PILOT.md"]);
    expect(inAppHelpHref(aliasSlug)).toBe(`/help/${canonicalSlug}`);
  });

  it("keeps Core Pilot markdown free of internal operator and runbook phrases", () => {
    const loaded = tryLoadProductDocumentation(canonicalSlug);

    expect(loaded).not.toBeNull();

    const normalized = loaded!.markdown.toLowerCase();
    const violations = CORE_PILOT_BANNED_PHRASES.filter((phrase) => normalized.includes(phrase));

    expect(violations).toEqual([]);
  });

  it("retains complete-lifecycle depth sections in Core Pilot", () => {
    const loaded = tryLoadProductDocumentation(canonicalSlug);

    expect(loaded).not.toBeNull();
    expect(loaded!.markdown).toContain("Complete review lifecycle");
    expect(loaded!.markdown).toContain("Resolve decisions and risks");
    expect(loaded!.markdown).toContain("Export and share artifacts");
    expect(loaded!.markdown).toContain("Review states");
    expect(loaded!.markdown).toContain(
      "ArchLucid turns architecture evidence into a review with findings, decisions, evidence traceability, and export-ready artifacts.",
    );
  });

  it("hides maintenance metadata when prepared for buyer help presentation", () => {
    const loaded = tryLoadProductDocumentation(aliasSlug);

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
