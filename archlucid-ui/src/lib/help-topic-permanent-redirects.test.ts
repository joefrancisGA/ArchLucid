import { describe, expect, it } from "vitest";

import {
  HELP_TOPIC_PERMANENT_REDIRECTS,
  resolveHelpTopicPermanentRedirect,
} from "@/lib/help-topic-permanent-redirects";
import { REVIEW_GUIDE_HELP_TRAFFIC_PATH } from "@/lib/ui-route-traffic-review-guide-help";

describe("help-topic-permanent-redirects", () => {
  it("redirects retired creating-runs bookmarks to review-guide", () => {
    expect(HELP_TOPIC_PERMANENT_REDIRECTS["creating-runs"]).toBe(REVIEW_GUIDE_HELP_TRAFFIC_PATH);
    expect(resolveHelpTopicPermanentRedirect("creating-runs")).toBe(REVIEW_GUIDE_HELP_TRAFFIC_PATH);
    expect(resolveHelpTopicPermanentRedirect("review-guide")).toBeNull();
  });
});
