import { describe, expect, it } from "vitest";

import { searchHelpDocumentation } from "@/lib/help-index";
import { HELP_TOPIC_BANNED_COPY_PATTERNS } from "@/lib/help-product-language";
import { HELP_DOC_SEARCH_RECORDS } from "@/lib/help-index.generated";

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

  it("includes developer docs when explicitly requested", () => {
    const hits = searchHelpDocumentation("configuration", 30, { includeDeveloperDocs: true });

    expect(hits.some((h) => h.docPath.includes("CONFIGURATION_REFERENCE"))).toBe(true);
  });

  it("returns architect troubleshooting paths for troubleshooting queries", () => {
    const hits = searchHelpDocumentation("troubleshooting", 30);

    expect(hits.some((h) => h.docPath.toLowerCase().includes("first_pilot_troubleshooting"))).toBe(true);
    expect(hits.some((h) => h.docPath.toLowerCase() === "docs/runbooks/troubleshooting.md")).toBe(false);
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
