import { describe, expect, it } from "vitest";

import { estimateUploadSecondsRemaining, formatUploadEta } from "./format-upload-eta";

describe("format-upload-eta", () => {
  it("estimates remaining seconds from throughput", () => {
    const started = 0;
    const now = 10_000;
    const eta = estimateUploadSecondsRemaining(500, 1000, started, now);

    expect(eta).toBe(10);
  });

  it("formats short and long ETAs", () => {
    expect(formatUploadEta(12)).toBe("About 12 seconds remaining");
    expect(formatUploadEta(90)).toBe("About 2 minutes remaining");
    expect(formatUploadEta(0)).toBe("Finishing…");
  });
});
