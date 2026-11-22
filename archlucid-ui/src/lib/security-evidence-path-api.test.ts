import { describe, expect, it, vi } from "vitest";

import {
  buildSecurityEvidencePathExplanation,
  fetchOperationalSecurityFindingDetail,
  fetchSecurityEvidencePathAttackPathReport,
  fetchSecurityEvidencePathDetail,
  fetchSecurityEvidencePathRank,
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
  it("rejects blank finding and path identifiers before issuing requests", async () => {
    await expect(fetchOperationalSecurityFindingDetail("  ")).rejects.toThrow("findingId is required.");
    await expect(fetchSecurityEvidencePathDetail("  ")).rejects.toThrow("pathId is required.");
    await expect(fetchSecurityEvidencePathRank("  ")).rejects.toThrow("pathId is required.");
    await expect(buildSecurityEvidencePathExplanation("  ", {
      useSimulator: false,
      allowInsufficientEvidence: false,
    })).rejects.toThrow("pathId is required.");

    expect(proxyJsonGet).not.toHaveBeenCalled();
    expect(proxyJsonPost).not.toHaveBeenCalled();
  });

  it("trims and encodes finding and path identifiers as single route segments", async () => {
    vi.mocked(proxyJsonGet).mockResolvedValue({ succeeded: false });
    vi.mocked(proxyJsonPost).mockResolvedValue({ succeeded: false });

    await fetchOperationalSecurityFindingDetail(" finding/1 ");
    await fetchSecurityEvidencePathDetail(" path/1 ");
    await fetchSecurityEvidencePathRank(" path/1 ");
    await buildSecurityEvidencePathExplanation(" path/1 ", {
      useSimulator: false,
      allowInsufficientEvidence: false,
    });

    expect(proxyJsonGet).toHaveBeenNthCalledWith(
      1,
      "/api/proxy/v1/operational-security/findings/finding%2F1",
    );
    expect(proxyJsonGet).toHaveBeenNthCalledWith(
      2,
      "/api/proxy/v1/operational-security/paths/path%2F1",
    );
    expect(proxyJsonGet).toHaveBeenNthCalledWith(
      3,
      "/api/proxy/v1/operational-security/paths/path%2F1/rank",
    );
    expect(proxyJsonPost).toHaveBeenCalledWith(
      "/api/proxy/v1/operational-security/paths/path%2F1/explanations",
      { useSimulator: false, allowInsufficientEvidence: false },
    );
  });

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

  it("returns null when attack-path report failed", async () => {
    vi.mocked(proxyJsonGet).mockResolvedValue({
      succeeded: false,
      snapshotId: "snap-1",
    });

    const report = await fetchSecurityEvidencePathAttackPathReport("snap-1");

    expect(report).toBeNull();
  });

  it("filters blank unevaluated path ids", async () => {
    vi.mocked(proxyJsonGet).mockResolvedValue({
      succeeded: true,
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
