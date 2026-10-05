import { describe, expect, it } from "vitest";

import { resolveBlockingFindingCountPresentation } from "./blocking-finding-count-display";

describe("resolveBlockingFindingCountPresentation", () => {
  it("marks omitted counts as unknown", () => {
    expect(resolveBlockingFindingCountPresentation(undefined).known).toBe(false);
    expect(resolveBlockingFindingCountPresentation(Number.NaN).known).toBe(false);
  });

  it("normalizes finite counts", () => {
    expect(resolveBlockingFindingCountPresentation(2)).toEqual({ known: true, value: 2 });
  });
});
