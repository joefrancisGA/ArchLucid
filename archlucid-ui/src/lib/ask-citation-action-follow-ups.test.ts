import { describe, expect, it } from "vitest";

import type { CitationReference } from "@/types/explanation";

import {
  buildAskCitationActionFollowUps,
  collectAskCitationFindingIds,
  parseAskCitationRefsFromMessageMetadata,
} from "@/lib/ask-citation-action-follow-ups";
import { GOVERNANCE_DECISION_REGISTER_PATH } from "@/lib/governance/governance-route-paths";

describe("buildAskCitationActionFollowUps", () => {
  it("returns honest empty when run id is missing", () => {
    const chips = buildAskCitationActionFollowUps({
      runId: "   ",
      referencedFindings: ["finding-1"],
    });

    expect(chips).toEqual([]);
  });

  it("returns honest empty when no actionable citation ids are present", () => {
    const chips = buildAskCitationActionFollowUps({
      runId: "run-a",
      groundingLinks: [
        { label: "Open review", href: "/architecture/reviews/run-a" },
        { label: "Evidence graph", href: "/insights/evidence-graph?runId=run-a" },
      ],
    });

    expect(chips).toEqual([]);
  });

  it("builds finding, evidence, and disposition chips from referencedFindings", () => {
    const chips = buildAskCitationActionFollowUps({
      runId: "run-a",
      referencedFindings: ["finding-123"],
    });

    expect(chips.map((c) => c.kind)).toEqual(["finding", "evidence", "disposition"]);
    expect(chips[0]?.href).toBe("/architecture/reviews/run-a/findings/finding-123");
    expect(chips[1]?.href).toBe("/architecture/reviews/run-a/findings/finding-123/evidence-trace");
    expect(chips[2]?.href).toBe(
      "/architecture/reviews/run-a/findings/finding-123/evidence-trace#governance-disposition-heading",
    );
    expect(chips[0]?.label.toLowerCase()).toContain("finding");
    expect(chips[1]?.label.toLowerCase()).toContain("evidence");
    expect(chips[2]?.label.toLowerCase()).toContain("disposition");
  });

  it("builds chips from CitationReference Finding payloads", () => {
    const citations: CitationReference[] = [
      {
        kind: "Finding",
        id: "sensitive-data-minimization-risk",
        label: "PHI minimization risk",
        runId: "run-demo",
      },
    ];

    const chips = buildAskCitationActionFollowUps({
      runId: "run-demo",
      citations,
    });

    expect(chips.some((c) => c.kind === "finding" && c.href.includes("/findings/sensitive-data-minimization-risk"))).toBe(
      true,
    );
    expect(chips.some((c) => c.kind === "evidence" && c.href.endsWith("/evidence-trace"))).toBe(true);
    expect(chips.some((c) => c.kind === "disposition")).toBe(true);
  });

  it("extracts finding ids from grounding deep-links", () => {
    const ids = collectAskCitationFindingIds({
      runId: "run-a",
      groundingLinks: [
        {
          label: "PHI minimization risk",
          href: "/architecture/reviews/run-a/findings/sensitive-data-minimization-risk",
        },
      ],
    });

    expect(ids).toEqual(["sensitive-data-minimization-risk"]);

    const chips = buildAskCitationActionFollowUps({
      runId: "run-a",
      groundingLinks: [
        {
          label: "PHI minimization risk",
          href: "/architecture/reviews/run-a/findings/sensitive-data-minimization-risk",
        },
      ],
    });

    expect(chips.length).toBeGreaterThan(0);
    expect(chips[0]?.citationId).toBe("sensitive-data-minimization-risk");
  });

  it("opens Decision register from DecisionTrace / referencedDecisions when no findings", () => {
    const chips = buildAskCitationActionFollowUps({
      runId: "run-a",
      referencedDecisions: ["decision-9"],
      citations: [
        {
          kind: "DecisionTrace",
          id: "trace-1",
          label: "Decision trace",
          runId: "run-a",
        },
      ],
    });

    expect(chips.every((c) => c.kind === "disposition")).toBe(true);
    expect(chips.every((c) => c.href === GOVERNANCE_DECISION_REGISTER_PATH)).toBe(true);
    expect(chips.length).toBe(1);
  });

  it("opens evidence graph from EvidenceBundle refs when no finding ids", () => {
    const chips = buildAskCitationActionFollowUps({
      runId: "run-a",
      citations: [
        {
          kind: "EvidenceBundle",
          id: "bundle-1",
          label: "Evidence bundle",
          runId: "run-a",
        },
      ],
    });

    expect(chips).toHaveLength(1);
    expect(chips[0]?.kind).toBe("evidence");
    expect(chips[0]?.href).toContain("/insights/evidence-graph?");
    expect(chips[0]?.href).toContain("runId=run-a");
  });

  it("dedupes finding ids across citation sources", () => {
    const chips = buildAskCitationActionFollowUps({
      runId: "run-a",
      referencedFindings: ["finding-1", "finding-1"],
      citations: [
        {
          kind: "Finding",
          id: "finding-1",
          label: "Same finding",
          runId: "run-a",
        },
      ],
      groundingLinks: [{ href: "/architecture/reviews/run-a/findings/finding-1/evidence-trace" }],
    });

    expect(chips.filter((c) => c.kind === "finding")).toHaveLength(1);
    expect(chips.filter((c) => c.kind === "evidence")).toHaveLength(1);
  });
});

describe("parseAskCitationRefsFromMessageMetadata", () => {
  it("returns null for empty or blank metadata", () => {
    expect(parseAskCitationRefsFromMessageMetadata(undefined)).toBeNull();
    expect(parseAskCitationRefsFromMessageMetadata("{}")).toBeNull();
  });

  it("parses Ask referenced lists from metadataJson", () => {
    const parsed = parseAskCitationRefsFromMessageMetadata(
      JSON.stringify({
        referencedFindings: ["f-1"],
        referencedDecisions: ["d-1"],
        referencedArtifacts: ["a-1"],
      }),
    );

    expect(parsed).not.toBeNull();
    expect(parsed?.referencedFindings).toEqual(["f-1"]);
    expect(parsed?.referencedDecisions).toEqual(["d-1"]);
    expect(parsed?.referencedArtifacts).toEqual(["a-1"]);
  });
});
