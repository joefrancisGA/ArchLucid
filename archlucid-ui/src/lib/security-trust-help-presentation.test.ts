import { describe, expect, it } from "vitest";

import { extractHelpMarkdownHeadings } from "@/lib/help-markdown-headings";
import {
  buildSecurityTrustTocGroups,
  computeSecurityTrustPostureCounts,
  countSecurityTrustPostureTableRows,
  mapSecurityTrustPostureStatusToTagKind,
  promoteSecurityTrustPostureSection,
  resolveSecurityTrustPostureStatusTagLabel,
} from "@/lib/security-trust-help-presentation";

const SAMPLE_POSTURE_TABLE = `## Posture summary

| Control | Status | Evidence | Last reviewed |
|---------|--------|----------|---------------|
| SOC 2 mapping | Self-asserted | [SOC 2](/help/soc2-self-assessment) | 2026-07-24 |
| Third-party pen test | Planned, not yet scheduled — no vendor committed | [Procurement](/help/procurement) | 2026-07-24 |
| Owner pen test | Active control | [Owner](/help/procurement) | 2026-07-24 |
| SoW template | Template only — use when scheduled | [Template](/help/procurement) | 2026-07-24 |
| CPA SOC 2 | Not issued — interim self-assessment only | [SOC 2](/help/soc2-self-assessment) | 2026-07-24 |

---

## Self-asserted controls
`;

describe("security-trust-help-presentation", () => {
  it("maps posture summary status labels to short tag labels", () => {
    expect(resolveSecurityTrustPostureStatusTagLabel("Self-asserted")).toBe("Self-asserted");
    expect(resolveSecurityTrustPostureStatusTagLabel("Planned, not yet scheduled — no vendor committed")).toBe(
      "Planned",
    );
    expect(resolveSecurityTrustPostureStatusTagLabel("Active control")).toBe("Active");
    expect(resolveSecurityTrustPostureStatusTagLabel("Not issued — interim self-assessment only")).toBe("Not issued");
  });

  it("maps posture summary status labels to StatusTag kinds", () => {
    expect(mapSecurityTrustPostureStatusToTagKind("Self-asserted")).toBe("neutral");
    expect(mapSecurityTrustPostureStatusToTagKind("Planned, not yet scheduled")).toBe("in-progress");
    expect(mapSecurityTrustPostureStatusToTagKind("Active control")).toBe("in-progress");
    expect(mapSecurityTrustPostureStatusToTagKind("Not issued — interim self-assessment only")).toBe(
      "needs-attention",
    );
  });

  it("promotes posture summary above procurement accelerator", () => {
    const markdown = [
      "# ArchLucid Trust Center",
      "",
      "Intro paragraph.",
      "",
      "---",
      "",
      "## Procurement questionnaire accelerator",
      "",
      "Accelerator copy.",
      "",
      SAMPLE_POSTURE_TABLE,
    ].join("\n");

    const promoted = promoteSecurityTrustPostureSection(markdown);
    const postureIdx = promoted.indexOf("## Posture summary");
    const procurementIdx = promoted.indexOf("## Procurement questionnaire accelerator");

    expect(postureIdx).toBeGreaterThan(-1);
    expect(procurementIdx).toBeGreaterThan(postureIdx);
    expect((promoted.match(/## Posture summary/g) ?? []).length).toBe(1);
  });

  it("computes posture summary counts from the status column", () => {
    const counts = computeSecurityTrustPostureCounts(SAMPLE_POSTURE_TABLE);

    expect(counts).toEqual({
      selfAsserted: 1,
      planned: 1,
      active: 1,
      templateOnly: 1,
      notIssued: 1,
    });
    expect(countSecurityTrustPostureTableRows(SAMPLE_POSTURE_TABLE)).toBe(5);
  });

  it("groups security-trust TOC headings by buyer theme", () => {
    const headings = extractHelpMarkdownHeadings(
      [
        "## Posture summary",
        "## Healthcare and PHI",
        "## Procurement questionnaire accelerator",
        "## Scalability and load evidence",
        "## Self-asserted controls",
      ].join("\n\n"),
    );
    const groups = buildSecurityTrustTocGroups(headings);

    expect(groups.map((group) => group.label)).toEqual([
      "Posture and assurance",
      "Data handling and connectivity",
      "Procurement",
      "Engineering evidence",
    ]);
  });
});
