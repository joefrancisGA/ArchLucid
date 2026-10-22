import { describe, expect, it } from "vitest";

import { resolveExpectedCurrentDispositionRowVersion } from "@/lib/findings/finding-expected-current-disposition-row-version";

describe("resolveExpectedCurrentDispositionRowVersion (FP-02)", () => {
  it("prefers the conflict winner over history and inspect seed", () => {
    const resolved = resolveExpectedCurrentDispositionRowVersion({
      inspectPayloadRowVersionBase64: "SEED=",
      latestHistoryEvent: { currentDispositionRowVersionBase64: "HIST=" },
      conflict: { currentDispositionRowVersionBase64: "WIN=" },
    });

    expect(resolved).toBe("WIN=");
  });

  it("prefers latest history over inspect payload seed", () => {
    const resolved = resolveExpectedCurrentDispositionRowVersion({
      inspectPayloadRowVersionBase64: "SEED=",
      latestHistoryEvent: { currentDispositionRowVersionBase64: "HIST=" },
    });

    expect(resolved).toBe("HIST=");
  });

  it("falls back to inspect payload seed", () => {
    const resolved = resolveExpectedCurrentDispositionRowVersion({
      inspectPayloadRowVersionBase64: "  SEED=  ",
    });

    expect(resolved).toBe("SEED=");
  });

  it("returns undefined for empty history, empty inspect payload, and whitespace", () => {
    expect(resolveExpectedCurrentDispositionRowVersion({})).toBeUndefined();
    expect(
      resolveExpectedCurrentDispositionRowVersion({
        inspectPayloadRowVersionBase64: "   ",
        latestHistoryEvent: { currentDispositionRowVersionBase64: "" },
        conflict: { currentDispositionRowVersionBase64: null },
      }),
    ).toBeUndefined();
  });
});
