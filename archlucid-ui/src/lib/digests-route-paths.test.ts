import { describe, expect, it } from "vitest";

import {
  DIGESTS_BROWSE_TAB_PATH,
  DIGESTS_HUB_PATH,
  DIGESTS_SCHEDULE_TAB_PATH,
  DIGESTS_SUBSCRIPTIONS_TAB_PATH,
  digestsBrowseDigestDeepLink,
  digestsHubTabPath,
  pathMatchesDigestsHub,
} from "@/lib/digests-route-paths";

describe("digests-route-paths", () => {
  it("exposes canonical Architecture hub paths", () => {
    expect(DIGESTS_HUB_PATH).toBe("/architecture/digests");
    expect(DIGESTS_SCHEDULE_TAB_PATH).toBe("/architecture/digests?tab=schedule");
    expect(DIGESTS_SUBSCRIPTIONS_TAB_PATH).toBe("/architecture/digests?tab=subscriptions");
    expect(DIGESTS_BROWSE_TAB_PATH).toBe("/architecture/digests?tab=browse");
    expect(digestsHubTabPath("browse")).toBe(DIGESTS_BROWSE_TAB_PATH);
  });

  it("builds browse deep links with digest hash anchors", () => {
    expect(digestsBrowseDigestDeepLink("digest-1")).toBe(
      "/architecture/digests?tab=browse#digest-digest-1",
    );
    expect(digestsBrowseDigestDeepLink("   ")).toBe(DIGESTS_BROWSE_TAB_PATH);
  });

  it("matches canonical and legacy hub pathnames", () => {
    expect(pathMatchesDigestsHub("/architecture/digests")).toBe(true);
    expect(pathMatchesDigestsHub("/digests")).toBe(true);
    expect(pathMatchesDigestsHub("/architecture/reviews")).toBe(false);
  });
});
