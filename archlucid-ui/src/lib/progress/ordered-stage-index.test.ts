import { describe, expect, it } from "vitest";

import { orderedStageIndex } from "@/lib/progress/ordered-stage-index";

describe("orderedStageIndex", () => {
  const stages = [
    { id: "first" as const },
    { id: "second" as const },
    { id: "third" as const },
  ];

  it("returns 0 for null active stage id", () => {
    expect(orderedStageIndex(stages, null)).toBe(0);
  });

  it("returns the matching index for a known stage", () => {
    expect(orderedStageIndex(stages, "second")).toBe(1);
  });

  it("returns 0 for an unknown stage id", () => {
    expect(orderedStageIndex(stages, "missing")).toBe(0);
  });
});
