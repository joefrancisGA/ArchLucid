import { describe, expect, it } from "vitest";

import {
  buildAskAnswerCitationSourceLinks,
  buyerAskGroundingLinksForRun,
} from "@/lib/ask-buyer-grounding-links";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

describe("buyerAskGroundingLinksForRun", () => {
  it("returns deterministic workspace anchors for the canonical showcase run id", () => {
    const links = buyerAskGroundingLinksForRun(SHOWCASE_STATIC_DEMO_RUN_ID);

    expect(links).not.toBeNull();
    expect(links!.length).toBe(7);
    expect(links![0]?.label).toBe("Sponsor report");
    expect(links![0]?.href).toContain("/architecture/reviews/");
    expect(links![1]?.href).toContain("/governance/sealed-records/");
    expect(links!.some((l) => l.href.includes("/findings/sensitive-data-minimization-risk"))).toBe(true);
    expect(links!.some((l) => l.href.includes("/insights/evidence-graph?"))).toBe(true);
    expect(links!.some((l) => l.href.includes("/governance/audit?"))).toBe(true);
    expect(links!.some((l) => l.href.includes("/insights/compare-two-reviews?"))).toBe(true);
    expect(links!.some((l) => l.href.includes("/governance/policy-packs/"))).toBe(true);
  });

  it("returns baseline review / evidence / audit cites for non-showcase reviews", () => {
    const links = buyerAskGroundingLinksForRun("some-other-run");

    expect(links).not.toBeNull();
    expect(links!.length).toBe(3);
    expect(links![0]?.label).toBe("Open review");
    expect(links!.some((l) => l.href.includes("/insights/evidence-graph?"))).toBe(true);
    expect(links!.some((l) => l.href.includes("/governance/audit?"))).toBe(true);
  });

  it("returns null when the run id is empty", () => {
    expect(buyerAskGroundingLinksForRun("")).toBeNull();
    expect(buyerAskGroundingLinksForRun("   ")).toBeNull();
  });

  it("buildAskAnswerCitationSourceLinks labels missing review id", () => {
    const links = buildAskAnswerCitationSourceLinks("", {
      referencedFindings: ["f-1"],
      referencedDecisions: [],
      referencedArtifacts: [],
    });

    expect(links).toEqual([{ label: "Review id was not stored." }]);
  });

  it("buildAskAnswerCitationSourceLinks does not fabricate decision deep links", () => {
    const links = buildAskAnswerCitationSourceLinks("run-a", {
      referencedFindings: [],
      referencedDecisions: ["decision-9"],
      referencedArtifacts: [],
    });

    expect(links).toHaveLength(1);
    expect(links[0]?.label).toBe("Decision citation decision-9. A link to that decision was not stored.");
    expect(links[0]?.href).toBeUndefined();
  });

  it("buildAskAnswerCitationSourceLinks keeps Open review for review id artifacts only", () => {
    const links = buildAskAnswerCitationSourceLinks("run-a", {
      referencedFindings: [],
      referencedDecisions: [],
      referencedArtifacts: ["run-a", "artifact-other"],
    });

    expect(links).toEqual([
      { label: "Open review", href: "/architecture/reviews/run-a" },
      {
        label: "Artifact id artifact-other. A link to that artifact was not stored.",
      },
    ]);
  });

  it("buildAskAnswerCitationSourceLinks labels empty decision citations", () => {
    const links = buildAskAnswerCitationSourceLinks("run-a", {
      referencedFindings: [],
      referencedDecisions: ["  "],
      referencedArtifacts: [],
    });

    expect(links).toEqual([{ label: "Decision citation was stored empty." }]);
  });

  it("buildAskAnswerCitationSourceLinks labels empty artifact citations", () => {
    const links = buildAskAnswerCitationSourceLinks("run-a", {
      referencedFindings: [],
      referencedDecisions: [],
      referencedArtifacts: [""],
    });

    expect(links).toEqual([{ label: "Artifact citation was stored empty." }]);
  });

  it("buildAskAnswerCitationSourceLinks omits href when finding is missing from index", () => {
    const links = buildAskAnswerCitationSourceLinks(
      "run-a",
      {
        referencedFindings: ["missing-finding"],
        referencedDecisions: [],
        referencedArtifacts: [],
      },
      { indexedFindingIds: new Set(["known-finding"]) },
    );

    expect(links).toHaveLength(1);
    expect(links[0]?.href).toBeUndefined();
    expect(links[0]?.label).toContain("missing-finding");
    expect(links[0]?.label).toContain("not in the loaded decision-grade findings index");
  });

  it("normalizes known demo aliases to the showcase spine", () => {
    const links = buyerAskGroundingLinksForRun("claims-intake-modernization-run");

    expect(links).not.toBeNull();
    expect(links!.length).toBeGreaterThan(0);
  });
});
