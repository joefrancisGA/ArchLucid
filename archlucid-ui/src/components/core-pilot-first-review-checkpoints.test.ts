import { describe, expect, it } from "vitest";

import { statusChipLabel } from "./core-pilot-first-review-checkpoints";

describe("core-pilot-first-review-checkpoints", () => {
  it("labels completed checkpoints as Complete", () => {
    expect(statusChipLabel("complete")).toBe("Complete");
  });
});
