import { describe, expect, it } from "vitest";

import { REVIEWS_HUB_UNFINISHED_WORK_HREF } from "@/lib/reviews-hub-unfinished-work-href";

describe("reviews-hub-unfinished-work-href", () => {
  it("links unfinished-work attention to the needs-attention hub filter", () => {
    expect(REVIEWS_HUB_UNFINISHED_WORK_HREF).toBe("/architecture/reviews?filter=needs-attention");
  });
});
