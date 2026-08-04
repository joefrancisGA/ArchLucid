import { describe, expect, it } from "vitest";

import { ASK_NO_REVIEW_PACKAGE_EMPTY } from "@/lib/ask-conversation-empty-preset";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

describe("ASK_NO_REVIEW_PACKAGE_EMPTY", () => {
  it("routes operators to start a review or load the sample workspace", () => {
    expect(ASK_NO_REVIEW_PACKAGE_EMPTY.title).toBe("No review available");
    expect(ASK_NO_REVIEW_PACKAGE_EMPTY.actions?.[0]?.href).toBe("/architecture/architectures/new");
    expect(ASK_NO_REVIEW_PACKAGE_EMPTY.actions?.[1]?.href).toBe(
      `/insights/evidence-graph?runId=${encodeURIComponent(SHOWCASE_STATIC_DEMO_RUN_ID)}`,
    );
  });
});
