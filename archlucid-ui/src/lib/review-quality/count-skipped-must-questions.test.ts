import { describe, expect, it } from "vitest";

import { countSkippedMustQuestions } from "@/lib/review-quality/count-skipped-must-questions";
import type { TransparencyTrail } from "@/types/feasibility-verdict";

describe("count-skipped-must-questions", () => {
  it("counts only MUST tier skips", () => {
    const trail: TransparencyTrail = {
      asserted: [],
      inferred: [],
      skipped: [
        { questionKey: "q1", tier: "Must" },
        { questionKey: "q2", tier: "Should" },
        { questionKey: "q3", tier: "Must" },
      ],
    };

    expect(countSkippedMustQuestions(trail)).toBe(2);
  });

  it("returns zero when trail is missing", () => {
    expect(countSkippedMustQuestions(null)).toBe(0);
  });
});
