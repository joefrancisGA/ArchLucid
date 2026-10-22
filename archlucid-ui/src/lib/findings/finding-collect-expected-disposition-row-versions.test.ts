import { beforeEach, describe, expect, it, vi } from "vitest";

const listFindingDispositions = vi.fn();

vi.mock("@/lib/api/governance-stickiness-api", () => ({
  listFindingDispositions: (...args: unknown[]) => listFindingDispositions(...args),
}));

import { collectExpectedCurrentDispositionRowVersionByFindingId } from "@/lib/findings/finding-collect-expected-disposition-row-versions";

describe("collectExpectedCurrentDispositionRowVersionByFindingId (FP-17)", () => {
  beforeEach(() => {
    listFindingDispositions.mockReset();
  });

  it("maps findings that already have a pointer and omits first-write findings", async () => {
    listFindingDispositions.mockImplementation(async (findingId: string) => {
      if (findingId === "f1") {
        return [{ currentDispositionRowVersionBase64: "AAA=" }];
      }

      return [];
    });

    const map = await collectExpectedCurrentDispositionRowVersionByFindingId(["f1", "f2", "f1"]);

    expect(map).toEqual({ f1: "AAA=" });
    expect(listFindingDispositions).toHaveBeenCalledTimes(2);
  });
});
