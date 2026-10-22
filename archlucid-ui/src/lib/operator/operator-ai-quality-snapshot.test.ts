import { afterEach, describe, expect, it, vi } from "vitest";

import {
  dispositionClass,
  dispositionLabel,
  fetchOperatorAiQualitySnapshot,
  type OperatorAiQualitySnapshotDisposition,
} from "@/lib/operator/operator-ai-quality-snapshot";

describe("operator-ai-quality-snapshot", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("dispositionLabel_returns_known_labels_without_throwing", () => {
    expect(dispositionLabel("PASS")).toBe("PASS");
    expect(dispositionLabel("WARN")).toBe("WARN");
    expect(dispositionLabel("NOT_GENERATED")).toBe("Not generated");
  });

  it("disposition_helpers_do_not_throw_for_unknown_runtime_disposition", () => {
    const unknownDisposition = "BOGUS" as OperatorAiQualitySnapshotDisposition;

    expect(() => dispositionLabel(unknownDisposition)).not.toThrow();
    expect(() => dispositionClass(unknownDisposition)).not.toThrow();
    expect(dispositionLabel(unknownDisposition)).toBe("BOGUS");
  });

  it("normalizes unknown disposition strings from the static snapshot", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          generatedUtc: "2026-01-01T00:00:00Z",
          disposition: "BOGUS",
          retrievalIr: {
            casesEvaluated: 1,
            meanRecallAt5: 0.5,
            meanMrr: 0.4,
            floorRecallAt5: 0.3,
            floorMrr: 0.2,
          },
          remediationLinks: [],
        }),
      }),
    );

    const snapshot = await fetchOperatorAiQualitySnapshot();

    expect(snapshot).not.toBeNull();
    expect(snapshot?.disposition).toBe("NOT_GENERATED");
    expect(dispositionLabel(snapshot!.disposition)).toBe("Not generated");
  });

  it("returns null when the snapshot payload is not an object", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => "not-json",
      }),
    );

    await expect(fetchOperatorAiQualitySnapshot()).resolves.toBeNull();
  });
});
