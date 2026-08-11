import { describe, expect, it } from "vitest";

import {
  buildSponsorRehearsalPreview,
  listSponsorRehearsalSectionIds,
  SPONSOR_REHEARSAL_CAUTION,
  SPONSOR_REHEARSAL_SECTION_ORDER,
} from "@/lib/sponsor-rehearsal-preview";

describe("sponsor-rehearsal-preview (TB-2208)", () => {
  it("lists the four rehearsal sections in order", () => {
    expect(listSponsorRehearsalSectionIds()).toEqual(SPONSOR_REHEARSAL_SECTION_ORDER);
    expect(listSponsorRehearsalSectionIds()).toEqual([
      "executive-summary",
      "key-findings-plain-english",
      "residual-risks",
      "what-is-excluded",
    ]);
  });

  it("returns honest empty copy when data is missing", () => {
    const preview = buildSponsorRehearsalPreview({});

    expect(preview.caution).toBe(SPONSOR_REHEARSAL_CAUTION);
    expect(preview.sections).toHaveLength(4);
    expect(preview.sections.every((section) => section.id.length > 0)).toBe(true);

    const byId = Object.fromEntries(preview.sections.map((section) => [section.id, section]));

    expect(byId["executive-summary"].isEmpty).toBe(true);
    expect(byId["executive-summary"].body).toMatch(/available yet/i);
    expect(byId["key-findings-plain-english"].isEmpty).toBe(true);
    expect(byId["residual-risks"].isEmpty).toBe(true);
    expect(byId["what-is-excluded"].isEmpty).toBe(false);
    expect(byId["what-is-excluded"].body).toMatch(/excluded/i);
  });

  it("reuses synopsis and plain-English finding builder content when present", () => {
    const preview = buildSponsorRehearsalPreview({
      packageTitle: "Claims intake review",
      synopsisParagraph: "2 accepted, 1 deferred. 1 finding still undisposed.",
      findings: [
        {
          title: "Public ingress",
          message: "Ingress is exposed to the public internet.",
          severity: "High",
          residualRisk: "Accepted with weekly sampling.",
        },
      ],
      excludedNotes: ["Internal CLI usage metrics"],
    });

    const byId = Object.fromEntries(preview.sections.map((section) => [section.id, section]));

    expect(byId["executive-summary"].isEmpty).toBe(false);
    expect(byId["executive-summary"].body).toContain("Claims intake review");
    expect(byId["executive-summary"].body).toContain("2 accepted");
    expect(byId["key-findings-plain-english"].isEmpty).toBe(false);
    expect(byId["key-findings-plain-english"].body).toContain("High finding: Public ingress");
    expect(byId["key-findings-plain-english"].body).toContain("elevated concern");
    expect(byId["residual-risks"].isEmpty).toBe(false);
    expect(byId["residual-risks"].body).toContain("weekly sampling");
    expect(byId["what-is-excluded"].body).toContain("Internal CLI usage metrics");
  });

  it("prefers explicit executiveSummary over synopsis", () => {
    const preview = buildSponsorRehearsalPreview({
      executiveSummary: "Board-ready summary paragraph.",
      synopsisParagraph: "Working synopsis should not win.",
    });

    expect(preview.sections[0].body).toBe("Board-ready summary paragraph.");
  });
});