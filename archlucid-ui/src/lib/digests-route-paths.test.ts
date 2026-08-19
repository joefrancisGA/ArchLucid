import { describe, expect, it } from "vitest";

import {
  DIGESTS_BROWSE_TAB_PATH,
  DIGESTS_HUB_PATH,
  DIGESTS_SCHEDULE_TAB_PATH,
  DIGESTS_SUBSCRIPTIONS_TAB_PATH,
  digestsBrowseDigestDeepLink,
  digestsHubNavigationPathname,
  digestsHubTabFromLocation,
  digestsHubTabPath,
  LEGACY_DIGEST_SUBSCRIPTIONS_PATH,
  pathMatchesDigestsHub,
} from "@/lib/digests-route-paths";

describe("digests-route-paths", () => {
  it("exposes canonical Architecture hub paths", () => {
    expect(DIGESTS_HUB_PATH).toBe("/architecture/digests");
    expect(DIGESTS_SCHEDULE_TAB_PATH).toBe("/architecture/digests?tab=schedule");
    expect(DIGESTS_SUBSCRIPTIONS_TAB_PATH).toBe("/architecture/digests?tab=subscriptions");
    expect(DIGESTS_BROWSE_TAB_PATH).toBe("/architecture/digests?tab=get-started");
    expect(digestsHubTabPath("get-started")).toBe(DIGESTS_BROWSE_TAB_PATH);
  });

  it("builds browse deep links with digest hash anchors", () => {
    expect(digestsBrowseDigestDeepLink("digest-1")).toBe(
      "/architecture/digests?tab=get-started#digest-digest-1",
    );
    expect(digestsBrowseDigestDeepLink("   ")).toBe(DIGESTS_BROWSE_TAB_PATH);
  });

  it("matches canonical and legacy hub pathnames", () => {
    expect(pathMatchesDigestsHub("/architecture/digests")).toBe(true);
    expect(pathMatchesDigestsHub("/digests")).toBe(true);
    expect(pathMatchesDigestsHub("/digest-subscriptions")).toBe(true);
    expect(pathMatchesDigestsHub("/architecture/reviews")).toBe(false);
  });

  it("resolves legacy subscriptions bookmarks to the Subscriptions tab and canonical navigation", () => {
    expect(digestsHubTabFromLocation(LEGACY_DIGEST_SUBSCRIPTIONS_PATH, null)).toBe("subscriptions");
    expect(digestsHubNavigationPathname(LEGACY_DIGEST_SUBSCRIPTIONS_PATH)).toBe(DIGESTS_HUB_PATH);
    expect(digestsHubNavigationPathname("/digests")).toBe(DIGESTS_HUB_PATH);
    expect(digestsHubNavigationPathname(DIGESTS_HUB_PATH)).toBe(DIGESTS_HUB_PATH);
  });
});
