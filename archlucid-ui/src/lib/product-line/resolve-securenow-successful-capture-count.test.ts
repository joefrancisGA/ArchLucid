import { beforeEach, describe, expect, it, vi } from "vitest";

import { resolveSecureNowSuccessfulCaptureCount } from "./resolve-securenow-successful-capture-count";
import { fetchInfraEvidenceSnapshots } from "@/lib/infra-evidence/infra-evidence-drift-api";

vi.mock("@/lib/infra-evidence/infra-evidence-drift-api", () => ({
  fetchInfraEvidenceSnapshots: vi.fn(),
}));

describe("resolveSecureNowSuccessfulCaptureCount", () => {
  beforeEach(() => {
    vi.mocked(fetchInfraEvidenceSnapshots).mockReset();
  });

  it("counts only successful captures", async () => {
    vi.mocked(fetchInfraEvidenceSnapshots).mockResolvedValue({
      items: [
        { snapshotId: "a", captureStatus: 1, resourceCount: 1, relationshipCount: 0 },
        { snapshotId: "b", captureStatus: 2, resourceCount: 0, relationshipCount: 0 },
      ],
      totalCount: 2,
      page: 1,
      pageSize: 50,
      hasMore: false,
    });

    await expect(resolveSecureNowSuccessfulCaptureCount()).resolves.toBe(1);
  });

  it("returns zero on load failure", async () => {
    vi.mocked(fetchInfraEvidenceSnapshots).mockRejectedValue(new Error("unreachable"));

    await expect(resolveSecureNowSuccessfulCaptureCount()).resolves.toBe(0);
  });
});
