import { describe, expect, it } from "vitest";

import { countWords, truncateToWordLimit } from "@/lib/architecture-structured-narrative";

describe("architecture structured narrative helpers", () => {
  it("counts words in narrative text", () => {
    expect(countWords("one two three")).toBe(3);
    expect(countWords("  ")).toBe(0);
  });

  it("truncates long narrative to the preview word limit", () => {
    const words = Array.from({ length: 240 }, (_, index) => `word${index}`).join(" ");
    const result = truncateToWordLimit(words, 200);

    expect(result.truncated).toBe(true);
    expect(countWords(result.preview)).toBeLessThanOrEqual(201);
  });
});
