import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  getItsmFindingCorrelationsSnapshot,
  requestItsmFindingCorrelations,
  resetItsmFindingCorrelationsStoreForTests,
} from "@/lib/itsm/itsm-finding-correlations-store";

const listItsmFindingCorrelationsBatch = vi.fn();

vi.mock("@/lib/api/itsm-outbound-api", () => ({
  listItsmFindingCorrelationsBatch: (...args: unknown[]) => listItsmFindingCorrelationsBatch(...args),
}));

describe("itsm-finding-correlations-store", () => {
  beforeEach(() => {
    resetItsmFindingCorrelationsStoreForTests();
    listItsmFindingCorrelationsBatch.mockReset();
  });

  it("batches multiple finding ids into one API call", async () => {
    listItsmFindingCorrelationsBatch.mockResolvedValue({
      findings: [
        { findingId: "finding-1", correlations: [{ provider: "Jira", externalKey: "ARCH-1" }] },
        { findingId: "finding-2", correlations: [] },
      ],
    });

    requestItsmFindingCorrelations(["finding-1", "finding-2"]);
    await vi.waitFor(() => {
      expect(listItsmFindingCorrelationsBatch).toHaveBeenCalledTimes(1);
    });

    expect(listItsmFindingCorrelationsBatch).toHaveBeenCalledWith(["finding-1", "finding-2"]);
    expect(getItsmFindingCorrelationsSnapshot("finding-1").correlations).toHaveLength(1);
    expect(getItsmFindingCorrelationsSnapshot("finding-2").loaded).toBe(true);
  });
});
