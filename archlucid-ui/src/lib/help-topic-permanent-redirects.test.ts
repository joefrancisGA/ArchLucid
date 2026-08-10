import { describe, expect, it } from "vitest";

import {
  HELP_TOPIC_PERMANENT_REDIRECTS,
  resolveHelpTopicPermanentRedirect,
} from "@/lib/help-topic-permanent-redirects";
import { REVIEW_GUIDE_HELP_TRAFFIC_PATH } from "@/lib/ui-route-traffic-review-guide-help";
import { USERS_AND_ROLES_HELP_CANONICAL_PATH } from "@/lib/users-and-roles-help-evidence-copy";

describe("help-topic-permanent-redirects", () => {
  it("redirects retired creating-runs bookmarks to review-guide", () => {
    expect(HELP_TOPIC_PERMANENT_REDIRECTS["creating-runs"]).toBe(REVIEW_GUIDE_HELP_TRAFFIC_PATH);
    expect(resolveHelpTopicPermanentRedirect("creating-runs")).toBe(REVIEW_GUIDE_HELP_TRAFFIC_PATH);
    expect(resolveHelpTopicPermanentRedirect("review-guide")).toBeNull();
  });

  it("redirects operator-auth-roles alias to canonical users-and-roles help", () => {
    expect(HELP_TOPIC_PERMANENT_REDIRECTS["operator-auth-roles"]).toBe(USERS_AND_ROLES_HELP_CANONICAL_PATH);
    expect(resolveHelpTopicPermanentRedirect("operator-auth-roles")).toBe(USERS_AND_ROLES_HELP_CANONICAL_PATH);
  });
});
