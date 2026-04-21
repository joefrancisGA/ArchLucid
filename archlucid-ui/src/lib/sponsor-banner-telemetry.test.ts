import { describe, expect, it } from "vitest";

import { bucketDaysSinceFirstCommit } from "@/lib/sponsor-banner-telemetry";

describe("sponsor-banner-telemetry", () => {
  it("maps day counts to stable buckets", () => {
    expect(bucketDaysSinceFirstCommit(0)).toBe("0");
    expect(bucketDaysSinceFirstCommit(1)).toBe("1-3");
    expect(bucketDaysSinceFirstCommit(3)).toBe("1-3");
    expect(bucketDaysSinceFirstCommit(4)).toBe("4-7");
    expect(bucketDaysSinceFirstCommit(30)).toBe("8-30");
    expect(bucketDaysSinceFirstCommit(31)).toBe("30+");
  });
});
