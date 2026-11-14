import { describe, expect, it, vi } from "vitest";

import {
  buildSecurityEvidencePathExplanation,
  fetchSecurityEvidencePathAttackPathReport,
  fetchSecurityEvidencePathDetail,
} from "@/lib/security-evidence-path-api";
import { proxyJsonGet, proxyJsonPost } from "@/lib/proxy-json-client";
import {
  SECURITY_EVIDENCE_PATH_HOP_EVIDENCE_NOT_STORED,
  SECURITY_EVIDENCE_PATH_RECOMMENDED_CHANGE_NOT_STORED,
  SECURITY_EVIDENCE_PATH_RELATIONSHIP_TYPE_NOT_STORED,
  SECURITY_EVIDENCE_PATH_WEAKEST_HOP_REASON_NOT_STORED,
} from "@/lib/security-evidence-path-types";

vi.mock("@/lib/proxy-json-client", () => ({
  proxyJsonGet: vi.fn(),
  proxyJsonPost: vi.fn(),
}));

describe("security-evidence-path-api", () => {
  it("returns normalized stored hop labels", async () => {
    vi.mocked(proxyJsonGet).mockResolvedValue({
      pathId: "path-1",
      hops: [
        {
          fromNodeLabel: "  reader-role  ",
          toNodeLabel: "\tstorage-account\n",
          edgeType: "  CAN_READ ",
          provenanceKind: "ObservedFact",
          hopConfidenceBand: "Confirmed",
        },
      ],
    });

    const detail = await fetchSecurityEvidencePathDetail("path-1");

    expect(detail?.hops[0]).toMatchObject({
      fromNodeLabel: "reader-role",
      toNodeLabel: "storage-account",
      edgeType: "CAN_READ",
    });
  });

  it("uses the canonical omission label when edge type is missing", async () => {
    vi.mocked(proxyJsonGet).mockResolvedValue({
      pathId: "path-1",
      hops: [
        {
          fromNodeLabel: "reader-role",
          toNodeLabel: "storage-account",
          edgeType: "   ",
        },
      ],
    });

    const detail = await fetchSecurityEvidencePathDetail("path-1");

    expect(detail?.hops[0]?.edgeType).toBe(SECURITY_EVIDENCE_PATH_RELATIONSHIP_TYPE_NOT_STORED);
  });

  it("maps missing hop evidence to the canonical omission label", async () => {
    vi.mocked(proxyJsonGet).mockResolvedValue({
      pathId: "path-1",
      hops: [
        {
          fromNodeLabel: "reader-role",
          toNodeLabel: "storage-account",
          edgeType: "CAN_READ",
          evidenceReference: "  ",
        },
      ],
    });

    const detail = await fetchSecurityEvidencePathDetail("path-1");

    expect(detail?.hops[0]?.evidenceReference).toBe(SECURITY_EVIDENCE_PATH_HOP_EVIDENCE_NOT_STORED);
  });

  it("does not stringify non-string provenance or confidence codes on hops", async () => {
    vi.mocked(proxyJsonGet).mockResolvedValue({
      pathId: "path-1",
      hops: [
        {
          fromNodeLabel: "a",
          toNodeLabel: "b",
          edgeType: "CAN_READ",
          provenanceKind: { code: "ObservedFact" },
          hopConfidenceBand: 42,
        },
      ],
    });

    const detail = await fetchSecurityEvidencePathDetail("path-1");

    expect(detail?.hops[0]).toMatchObject({
      provenanceKind: "",
      hopConfidenceBand: "",
    });
  });

  it("maps weakest hop reason and trims cut point endpoint labels", async () => {
    vi.mocked(proxyJsonGet).mockResolvedValue({
      pathId: "path-1",
      weakestHop: {
        reason: "  egress gap  ",
        edgeType: "CAN_READ",
      },
      relatedCutPoints: [
        {
          cutPointId: "cp-1",
          fromNodeLabel: "  src  ",
          toNodeLabel: " dst ",
          collapsedPathIds: [" path-a ", "", "path-b"],
        },
      ],
    });

    const detail = await fetchSecurityEvidencePathDetail("path-1");

    expect(detail?.weakestHop?.reason).toBe("egress gap");
    expect(detail?.relatedCutPoints[0]?.fromNodeLabel).toBe("src");
    expect(detail?.relatedCutPoints[0]?.toNodeLabel).toBe("dst");
    expect(detail?.relatedCutPoints[0]?.collapsedPathIds).toEqual(["path-a", "path-b"]);
  });

  it("filters blank unevaluated path ids", async () => {
    vi.mocked(proxyJsonGet).mockResolvedValue({
      snapshotId: "snap-1",
      vulnerableAttackPaths: [],
      unevaluatedGroups: [
        {
          reasonCode: "LIMIT",
          whyText: "Cap reached",
          pathIds: [" path-1 ", "", "  "],
        },
      ],
    });

    const report = await fetchSecurityEvidencePathAttackPathReport("snap-1");

    expect(report?.unevaluatedGroups[0]?.pathIds).toEqual(["path-1"]);
  });

  it("maps missing recommended change on explanations", async () => {
    vi.mocked(proxyJsonPost).mockResolvedValue({
      succeeded: true,
      explanation: {
        explanationId: "exp-1",
        proposedRemediation: {
          recommendedChange: "   ",
        },
      },
    });

    const result = await buildSecurityEvidencePathExplanation("path-1", {
      useSimulator: true,
      allowInsufficientEvidence: false,
    });

    expect(result.explanation?.proposedRemediation.recommendedChange).toBe(
      SECURITY_EVIDENCE_PATH_RECOMMENDED_CHANGE_NOT_STORED,
    );
  });

  it("maps missing detail weakestHopReason to the omission label", async () => {
    vi.mocked(proxyJsonGet).mockResolvedValue({
      pathId: "path-1",
      weakestHopReason: " ",
    });

    const detail = await fetchSecurityEvidencePathDetail("path-1");

    expect(detail?.weakestHopReason).toBe(SECURITY_EVIDENCE_PATH_WEAKEST_HOP_REASON_NOT_STORED);
  });
});
