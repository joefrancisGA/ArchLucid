import { describe, expect, it } from "vitest";

import { searchHelpDocumentation } from "@/lib/help/help-index";
import { HELP_TOPIC_BANNED_COPY_PATTERNS } from "@/lib/help/help-product-language";
import { HELP_DOC_SEARCH_RECORDS } from "@/lib/help/help-index.generated";

describe("searchHelpDocumentation", () => {
  it("returns first-review path sections for create/run style queries", () => {
    const hits = searchHelpDocumentation("how to create a run", 30);

    expect(hits.length).toBeGreaterThan(0);
    expect(hits.some((h) => h.docPath.includes("CORE_PILOT"))).toBe(true);
  });

  it("excludes developer-only docs from default shell search", () => {
    const hits = searchHelpDocumentation("configuration", 30);

    expect(hits.some((h) => h.docPath.includes("CONFIGURATION_REFERENCE"))).toBe(false);
  });

  it("does not surface internal-runbook topics even when includeDeveloperDocs is true (TB-1329 / TB-1385)", () => {
    const hits = searchHelpDocumentation("configuration reference API contracts openapi", 30, {
      includeDeveloperDocs: true,
    });

    expect(hits.some((h) => h.docPath.includes("CONFIGURATION_REFERENCE"))).toBe(false);
    expect(hits.some((h) => h.docPath.toLowerCase().includes("api_contracts"))).toBe(false);
  });

  it("returns architect troubleshooting paths for troubleshooting queries (TB-2237)", () => {
    const hits = searchHelpDocumentation("troubleshooting", 30);

    expect(hits.some((h) => h.docPath.toLowerCase().startsWith("in-app:/help/troubleshooting"))).toBe(true);
    expect(hits.some((h) => h.docPath.toLowerCase().includes("first_pilot_troubleshooting"))).toBe(false);
    expect(hits.some((h) => h.docPath.toLowerCase() === "docs/runbooks/troubleshooting.md")).toBe(false);
  });

  it("omits all runbook paths from the generated customer help index (TB-2237)", () => {
    expect(HELP_DOC_SEARCH_RECORDS.some((r) => r.docPath.toLowerCase().startsWith("docs/runbooks/"))).toBe(false);
  });

  it("omits engineering troubleshooting runbook from the generated product help index (TB-1247)", () => {
    expect(
      HELP_DOC_SEARCH_RECORDS.some(
        (r) => r.docPath.toLowerCase() === "docs/runbooks/troubleshooting.md",
      ),
    ).toBe(false);

    for (const record of HELP_DOC_SEARCH_RECORDS) {
      const blob = `${record.docTitle}\n${record.sectionHeading}\n${record.excerpt}`.toLowerCase();

      expect(blob, `${record.docPath}#${record.sectionSlug}`).not.toContain("/help/engineering-troubleshooting");
      expect(blob, `${record.docPath}#${record.sectionSlug}`).not.toContain("engineering troubleshooting");
    }
  });

  it("does not surface engineering troubleshooting via default shell search (TB-1247)", () => {
    const hits = searchHelpDocumentation("engineering troubleshooting CLI logs", 40);

    expect(hits.some((h) => h.docPath.toLowerCase() === "docs/runbooks/troubleshooting.md")).toBe(false);
    expect(
      hits.some((h) => `${h.docTitle} ${h.excerpt}`.toLowerCase().includes("engineering troubleshooting")),
    ).toBe(false);
  });

  it("omits governance API contracts from the generated product help index (TB-1385)", () => {
    expect(
      HELP_DOC_SEARCH_RECORDS.some((r) => r.docPath.toLowerCase().includes("api_contracts")),
    ).toBe(false);

    for (const record of HELP_DOC_SEARCH_RECORDS) {
      const blob = `${record.docTitle}\n${record.sectionHeading}\n${record.excerpt}`.toLowerCase();

      expect(blob, `${record.docPath}#${record.sectionSlug}`).not.toContain("/help/governance-api-contracts");
      expect(blob, `${record.docPath}#${record.sectionSlug}`).not.toContain("governance and api contracts");
    }
  });

  it("does not surface governance API contracts via default shell search (TB-1385)", () => {
    const hits = searchHelpDocumentation("openapi contract snapshot API contracts governance", 40);

    expect(hits.some((h) => h.docPath.toLowerCase().includes("api_contracts"))).toBe(false);
    expect(
      hits.some((h) => `${h.docTitle} ${h.excerpt}`.toLowerCase().includes("governance-api-contracts")),
    ).toBe(false);
  });

  it("returns procurement FAQ entries for procurement keywords", () => {
    const hits = searchHelpDocumentation("SOC 2 procurement", 30);

    expect(hits.some((h) => h.docPath.includes("BUYER_SECURITY_PROCUREMENT_PACKET"))).toBe(true);
  });

  it("generated search excerpts avoid legacy manifest/run-primary help copy", () => {
    for (const record of HELP_DOC_SEARCH_RECORDS) {
      const combined = `${record.sectionHeading} ${record.excerpt}`.toLowerCase();

      for (const pattern of HELP_TOPIC_BANNED_COPY_PATTERNS) {
        expect(combined, `${record.docPath}#${record.sectionSlug}`).not.toContain(pattern);
      }
    }
  });
});
