import { describe, expect, it } from "vitest";

import { ASK_NO_REVIEW_PACKAGE_EMPTY } from "@/lib/ask-conversation-empty-preset";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

describe("ASK_NO_REVIEW_PACKAGE_EMPTY", () => {
  it("routes operators to open reviews or start a review before sample workspace", () => {
    expect(ASK_NO_REVIEW_PACKAGE_EMPTY.title).toBe("No finalized reviews yet");
    expect(ASK_NO_REVIEW_PACKAGE_EMPTY.actions?.[0]?.label).toBe("Open reviews");
    expect(ASK_NO_REVIEW_PACKAGE_EMPTY.actions?.[0]?.href).toBe("/architecture/reviews");
    expect(ASK_NO_REVIEW_PACKAGE_EMPTY.actions?.[1]?.href).toBe("/architecture/reviews/new");
    expect(ASK_NO_REVIEW_PACKAGE_EMPTY.actions?.[2]?.href).toBe(
      `/insights/evidence-graph?runId=${encodeURIComponent(SHOWCASE_STATIC_DEMO_RUN_ID)}`,
    );
  });
});
