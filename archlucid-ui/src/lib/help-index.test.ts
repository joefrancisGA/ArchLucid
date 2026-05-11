import { describe, expect, it } from "vitest";

import { searchHelpDocumentation } from "@/lib/help-index";

describe("searchHelpDocumentation", () => {
  it("returns Core Pilot sections for create/run style queries", () => {
    const hits = searchHelpDocumentation("how to create a run", 30);

    expect(hits.length).toBeGreaterThan(0);
    expect(hits.some((h) => h.docPath.includes("CORE_PILOT"))).toBe(true);
  });

  it("returns configuration reference material for configuration queries", () => {
    const hits = searchHelpDocumentation("configuration", 30);

    expect(hits.some((h) => h.docPath.includes("CONFIGURATION_REFERENCE"))).toBe(true);
  });

  it("returns troubleshooting doc for troubleshooting queries", () => {
    const hits = searchHelpDocumentation("troubleshooting", 30);

    expect(hits.some((h) => h.docPath.includes("TROUBLESHOOTING"))).toBe(true);
  });

  it("returns procurement FAQ entries for procurement keywords", () => {
    const hits = searchHelpDocumentation("SOC 2 procurement", 30);

    expect(hits.some((h) => h.docPath.includes("PROCUREMENT_FAQ"))).toBe(true);
  });
});
