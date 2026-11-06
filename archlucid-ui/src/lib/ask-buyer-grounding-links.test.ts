import { describe, expect, it } from "vitest";

import {
  buildAskAnswerCitationSourceLinks,
  buyerAskGroundingLinksForRun,
  collectCitedReviewIdsFromAskAnswerRefs,
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
    expect(links!.some((l) => l.href?.includes("reviewTab=findings&findingId="))).toBe(true);
    expect(links!.some((l) => l.href?.includes("#run-detail-first-review-spine-findings"))).toBe(true);
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
    expect(links![0]?.href).toBe("/architecture/reviews/some-other-run");
    expect(links!.some((l) => l.href.includes("/insights/evidence-graph?"))).toBe(true);
    expect(links!.some((l) => l.href.includes("/governance/audit?"))).toBe(true);
  });

  it("grounds Open review in the findings workspace when a cited finding is known", () => {
    const links = buyerAskGroundingLinksForRun("run-a", { primaryFindingId: "finding-9" });

    expect(links![0]?.href).toBe(
      "/architecture/reviews/run-a?reviewTab=findings&findingId=finding-9#run-detail-first-review-spine-findings",
    );
  });

  it("nests Open review when architecture id is supplied without a finding", () => {
    const links = buyerAskGroundingLinksForRun("run-42", { architectureId: "architecture-identity-001" });

    expect(links![0]?.href).toBe("/architecture/architectures/architecture-identity-001/reviews/run-42");
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
      { label: "Review id run-a", href: "/architecture/reviews/run-a" },
      {
        label: "Artifact id artifact-other. A link to that artifact was not stored.",
      },
    ]);
  });

  it("buildAskAnswerCitationSourceLinks grounds review id cite when findings are also stored", () => {
    const links = buildAskAnswerCitationSourceLinks("run-a", {
      referencedFindings: ["finding-1"],
      referencedDecisions: [],
      referencedArtifacts: ["run-a"],
    });

    expect(links).toEqual([
      {
        label: "Finding id finding-1",
        href: "/architecture/reviews/run-a?reviewTab=findings&findingId=finding-1#run-detail-first-review-spine-findings",
      },
      {
        label: "Review id run-a",
        href: "/architecture/reviews/run-a?reviewTab=findings&findingId=finding-1#run-detail-first-review-spine-findings",
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

  it("buildAskAnswerCitationSourceLinks links indexed findings to the review findings workspace", () => {
    const links = buildAskAnswerCitationSourceLinks(
      "run-a",
      {
        referencedFindings: ["known-finding"],
        referencedDecisions: [],
        referencedArtifacts: [],
      },
      { indexedFindingIds: new Set(["known-finding"]) },
    );

    expect(links[0]?.href).toBe(
      "/architecture/reviews/run-a?reviewTab=findings&findingId=known-finding#run-detail-first-review-spine-findings",
    );
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

  it("buildAskAnswerCitationSourceLinks nests review artifact href when architecture is supplied", () => {
    const links = buildAskAnswerCitationSourceLinks(
      "run-a",
      {
        referencedFindings: [],
        referencedDecisions: [],
        referencedArtifacts: ["run-a"],
      },
      { architectureId: "architecture-identity-001" },
    );

    expect(links[0]?.href).toBe("/architecture/architectures/architecture-identity-001/reviews/run-a");
  });

  it("collectCitedReviewIdsFromAskAnswerRefs only cites review id artifacts, not other artifact UUIDs", () => {
    const runId = "11111111-1111-4111-8111-111111111111";
    const artifactId = "22222222-2222-4222-8222-222222222222";

    const cited = collectCitedReviewIdsFromAskAnswerRefs(runId, {
      referencedFindings: [],
      referencedDecisions: [],
      referencedArtifacts: [artifactId, runId],
    });

    expect(cited.has(runId.toLowerCase())).toBe(true);
    expect(cited.has(artifactId.toLowerCase())).toBe(false);
    expect(cited.size).toBe(1);
  });

  it("normalizes known demo aliases to the showcase spine", () => {
    const links = buyerAskGroundingLinksForRun("claims-intake-modernization-run");

    expect(links).not.toBeNull();
    expect(links!.length).toBeGreaterThan(0);
  });
});
