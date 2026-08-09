import { describe, expect, it } from "vitest";

import {
  buildCaiqSigResponseTocGroups,
  computeCaiqSigResponsePostureCounts,
  prepareCaiqSigResponseHelpMarkdown,
  resolveCaiqSigEvidenceAffordance,
  resolveCaiqSigStatusTagLabel,
} from "@/lib/caiq-sig-response-help-presentation";
import { extractHelpMarkdownHeadings } from "@/lib/help-markdown-headings";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";

describe("caiq-sig-response-help-presentation", () => {
  const loaded = tryLoadProductDocumentation("caiq-sig-response");

  it("prepares structured halves and consolidated SIG table", () => {
    if (loaded === null) {
      throw new Error("Expected caiq-sig-response documentation to load.");
    }

    const sourcePath = loaded.entry.sourcePaths[0] ?? "";
    const prepared = prepareCaiqSigResponseHelpMarkdown(loaded.markdown, sourcePath);

    expect(prepared).toContain("CAIQ Lite (subset)");
    expect(prepared).toContain("SIG Core (family summary index, not a full row checklist)");
    expect(prepared).toContain("| Family | Control intent | Status | Evidence |");
    expect(prepared).not.toContain("## Related");
  });

  it("normalizes SIG family C status narrative into evidence", () => {
    const sample = [
      "## Control family C — Human resources",
      "",
      "| Control intent | Status | Evidence |",
      "|---|---|---|",
      "| Personnel security | Partial — hiring checks tracked in HRIS | HRIS evidence pack on request |",
    ].join("\n");

    const prepared = prepareCaiqSigResponseHelpMarkdown(`${sample}\n\n---\n\n${sample}`, "docs/security/SIG_CORE_2026.md");

    expect(prepared).toContain("| Personnel security | Partial |");
    expect(resolveCaiqSigStatusTagLabel("Partial — hiring checks tracked in HRIS")).toBe("Partial");
  });

  it("builds grouped TOC parents without duplicate Related entries", () => {
    if (loaded === null) {
      throw new Error("Expected caiq-sig-response documentation to load.");
    }

    const sourcePath = loaded.entry.sourcePaths[0] ?? "";
    const prepared = prepareCaiqSigResponseHelpMarkdown(loaded.markdown, sourcePath);
    const headings = extractHelpMarkdownHeadings(prepared);
    const groups = buildCaiqSigResponseTocGroups(headings);

    expect(groups).toHaveLength(2);
    expect(groups[0]?.label).toContain("CAIQ Lite");
    expect(groups[1]?.label).toContain("SIG Core");
    expect(groups[0]?.headings.some((heading) => heading.title.toLowerCase() === "related")).toBe(false);
    expect(groups[1]?.headings.some((heading) => heading.title.toLowerCase() === "related")).toBe(false);
  });

  it("classifies evidence affordances for linked, inherited, and NDA rows", () => {
    expect(resolveCaiqSigEvidenceAffordance("[Trust Center](/help/security-trust)").kind).toBe("linked-artifact");
    expect(resolveCaiqSigEvidenceAffordance("Microsoft Azure DPA / trust pages", "Inherited").kind).toBe(
      "inherited-provider",
    );
    expect(resolveCaiqSigEvidenceAffordance("HRIS evidence pack on request").kind).toBe("nda-on-request");
    expect(resolveCaiqSigEvidenceAffordance("Edge/WAF/APIM optional; private endpoints documented").kind).toBe(
      "prose-only",
    );
  });

  it("computes posture counts from Status columns without promoting CAIQ Yes to Strong", () => {
    if (loaded === null) {
      throw new Error("Expected caiq-sig-response documentation to load.");
    }

    const sourcePath = loaded.entry.sourcePaths[0] ?? "";
    const prepared = prepareCaiqSigResponseHelpMarkdown(loaded.markdown, sourcePath);
    const counts = computeCaiqSigResponsePostureCounts(prepared);
    const total = counts.Strong + counts.Partial + counts.Planned + counts.Inherited;

    expect(total).toBeGreaterThan(0);
    expect(counts.Partial).toBeGreaterThan(0);
    // SIG Core Strong rows only — CAIQ Lite "Yes" must not inflate Strong.
    expect(counts.Strong).toBeLessThanOrEqual(11);
  });

  it("keeps CAIQ Yes out of Strong posture counts", () => {
    const markdown = [
      "## Governance (GOV)",
      "",
      "| Theme | Response | Notes |",
      "|---|---|---|",
      "| Policy | Yes | Linked |",
      "| Risk | Partial | Linked |",
      "",
      "---",
      "",
      "### SIG Core control families",
      "",
      "| Family | Control intent | Status | Evidence |",
      "|---|---|---|---|",
      "| A | Program | Strong | [Trust](/help/security-trust) |",
      "| B | Risk | Partial | Notes |",
    ].join("\n");

    const counts = computeCaiqSigResponsePostureCounts(markdown);

    expect(counts.Strong).toBe(1);
    expect(counts.Partial).toBe(2);
  });
});
