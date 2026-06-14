import { describe, expect, it } from "vitest";

import {
  REVIEWS_NEW_FIRST_SESSION_GUIDANCE,
  REVIEWS_NEW_PATH_HINTS,
  REVIEWS_NEW_PROOF_COLLECTION_HINT,
} from "@/lib/reviews-new-path-copy";

describe("reviews-new-path-copy first-session cognitive load", () => {
  it("emphasizes Pilot path before Operate in quick-review hint", () => {
    expect(REVIEWS_NEW_PATH_HINTS["quick-review"]).toMatch(/Pilot path/i);
    expect(REVIEWS_NEW_PATH_HINTS["quick-review"]).toMatch(/simulator|live/i);
  });

  it("defers detailed path until after first proof", () => {
    expect(REVIEWS_NEW_PATH_HINTS.detailed).toMatch(/after your first committed Pilot proof/i);
  });

  it("surfaces first-session guidance and proof collection command", () => {
    expect(REVIEWS_NEW_FIRST_SESSION_GUIDANCE).toMatch(/Create review → Execute → Commit/i);
    expect(REVIEWS_NEW_FIRST_SESSION_GUIDANCE).toMatch(/Operate/i);
    expect(REVIEWS_NEW_PROOF_COLLECTION_HINT).toMatch(/collect-first-pilot-proof/i);
    expect(REVIEWS_NEW_PROOF_COLLECTION_HINT).toMatch(/review-id/i);
  });
});
