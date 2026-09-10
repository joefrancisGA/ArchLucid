import { describe, expect, it } from "vitest";

import { formatCareerExportDemoHonestyMarkdown } from "@/lib/career-export-demo-chrome";

describe("formatCareerExportDemoHonestyMarkdown (FC-73)", () => {
  it("returns demo banner markdown for static demo runs", () => {
    const markdown = formatCareerExportDemoHonestyMarkdown({ usedStaticDemoRun: true });

    expect(markdown).toMatch(/NOT LIVE DATA/i);
    expect(markdown).toMatch(/demonstration/i);
  });

  it("returns empty markdown for live runs", () => {
    expect(formatCareerExportDemoHonestyMarkdown({ usedStaticDemoRun: false })).toBe("");
  });
});
