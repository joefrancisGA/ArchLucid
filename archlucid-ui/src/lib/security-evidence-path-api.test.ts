import { describe, expect, it, vi } from "vitest";

import { fetchSecurityEvidencePathDetail } from "@/lib/security-evidence-path-api";
import { proxyJsonGet } from "@/lib/proxy-json-client";
import {
  SECURITY_EVIDENCE_PATH_HOP_EVIDENCE_NOT_STORED,
  SECURITY_EVIDENCE_PATH_RELATIONSHIP_TYPE_NOT_STORED,
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
});
