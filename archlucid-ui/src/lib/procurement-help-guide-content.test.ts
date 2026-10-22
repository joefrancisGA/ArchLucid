import { describe, expect, it } from "vitest";

import {
  formatProcurementHelpProvenanceLine,
  prepareProcurementHelpBodyMarkdown,
  PROCUREMENT_HELP_PAGE_SUBTITLE,
  PROCUREMENT_HELP_PAGE_TITLE,
  PROCUREMENT_HELP_PATH,
} from "@/lib/procurement-help-guide-content";

describe("procurement-help-guide-content (TB-1253)", () => {
  it("keeps canonical buyer FAQ title and path", () => {
    expect(PROCUREMENT_HELP_PAGE_TITLE).toBe("Procurement FAQ");
    expect(PROCUREMENT_HELP_PATH).toBe("/help/procurement");
    expect(PROCUREMENT_HELP_PAGE_SUBTITLE.toLowerCase()).toMatch(/procurement|questionnaire|diligence/);
  });

  it("prepares FAQ-only body markdown without trust progression timeline", () => {
    const markdown = [
      "# Procurement FAQ",
      "",
      "## Trust progression timeline",
      "",
      "Internal only",
      "",
      "## Q & A",
      "",
      "### 1. Do you have SOC 2 Type II?",
      "",
      "Self-assessment only.",
      "",
      "## Trust progression timeline (duplicate)",
      "",
      "Should strip",
    ].join("\n");

    const body = prepareProcurementHelpBodyMarkdown(markdown);

    expect(body).toContain("## Q & A");
    expect(body).toContain("SOC 2");
    expect(body.toLowerCase()).not.toContain("trust progression timeline");
    expect(body).not.toContain("Internal only");
  });

  it("formats provenance from registry source path", () => {
    expect(
      formatProcurementHelpProvenanceLine({
        slug: "procurement",
        title: "Procurement FAQ",
        sourcePaths: ["docs/go-to-market/PROCUREMENT_FAQ.md"],
        audience: "buyer",
        contentKind: "product-help",
      }),
    ).toBe("Source: PROCUREMENT_FAQ.md");
  });
});
