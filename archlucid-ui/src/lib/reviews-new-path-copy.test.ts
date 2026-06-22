import { describe, expect, it } from "vitest";

import {
  REVIEWS_NEW_PATH_HINTS,
  REVIEWS_NEW_PROOF_COLLECTION_HINT,
} from "@/lib/reviews-new-path-copy";

describe("reviews-new-path-copy buyer-facing copy", () => {
  it("guided-intake hint mentions duration and system context without repeating the mode name", () => {
    expect(REVIEWS_NEW_PATH_HINTS["guided-intake"]).not.toMatch(/guided intake/i);
    expect(REVIEWS_NEW_PATH_HINTS["guided-intake"]).toMatch(/about 10 minutes/i);
    expect(REVIEWS_NEW_PATH_HINTS["guided-intake"]).toMatch(/system context/i);
  });

  it("quick-review hint is clearly for users with a ready brief", () => {
    expect(REVIEWS_NEW_PATH_HINTS["quick-review"]).toMatch(/brief/i);
  });

  it("detailed hint is for export-ready review packages", () => {
    expect(REVIEWS_NEW_PATH_HINTS.detailed).toMatch(/templates|imports|export/i);
  });

  it("proof collection hint references the collect script and review-id", () => {
    expect(REVIEWS_NEW_PROOF_COLLECTION_HINT).toMatch(/collect-first-pilot-proof/i);
    expect(REVIEWS_NEW_PROOF_COLLECTION_HINT).toMatch(/review-id/i);
  });
});
