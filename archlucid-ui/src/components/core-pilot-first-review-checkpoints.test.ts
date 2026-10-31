import { describe, expect, it } from "vitest";

import {
  buildFirstReviewCheckpointStrip,
  statusChipLabel,
} from "./core-pilot-first-review-checkpoints";

describe("core-pilot-first-review-checkpoints", () => {
  it("labels completed checkpoints as Complete", () => {
    expect(statusChipLabel("complete")).toBe("Complete");
  });

  it("keeps export in progress until a first-review export is recorded (P-16)", () => {
    const checkpoints = buildFirstReviewCheckpointStrip("committed", "run-1", "run-1", false, false);
    const exportStep = checkpoints.find((step) => step.id === "export");
    const sponsorStep = checkpoints.find((step) => step.id === "sponsor-ready");

    expect(exportStep?.status).toBe("active");
    expect(sponsorStep?.status).toBe("pending");
  });

  it("marks export complete when a first-review export is recorded", () => {
    const checkpoints = buildFirstReviewCheckpointStrip("committed", "run-1", "run-1", false, true);
    const exportStep = checkpoints.find((step) => step.id === "export");

    expect(exportStep?.status).toBe("complete");
  });
});
