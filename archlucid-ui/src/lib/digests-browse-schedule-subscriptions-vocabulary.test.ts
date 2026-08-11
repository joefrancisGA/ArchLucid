import { describe, expect, it } from "vitest";

import {
  DIGESTS_BROWSE_SCHEDULE_SUBSCRIPTIONS_BROWSE_LINK,
  DIGESTS_BROWSE_SCHEDULE_SUBSCRIPTIONS_COMPACT_LINE,
  DIGESTS_BROWSE_SCHEDULE_SUBSCRIPTIONS_HEADING,
  DIGESTS_BROWSE_SCHEDULE_SUBSCRIPTIONS_SCHEDULE_LINK,
  DIGESTS_BROWSE_SCHEDULE_SUBSCRIPTIONS_SUBSCRIPTIONS_LINK,
  DIGESTS_BROWSE_SCHEDULE_SUBSCRIPTIONS_WHY_THREE,
  buildDigestsBrowseScheduleSubscriptionsVocabulary,
  resolveDigestsBrowseScheduleSubscriptionsLink,
  resolveDigestsBrowseScheduleSubscriptionsPeerLinks,
} from "@/lib/digests-browse-schedule-subscriptions-vocabulary";
import {
  DIGESTS_BROWSE_TAB_PATH,
  DIGESTS_SCHEDULE_TAB_PATH,
  DIGESTS_SUBSCRIPTIONS_TAB_PATH,
} from "@/lib/digests-route-paths";

describe("digests-browse-schedule-subscriptions-vocabulary (TB-2290)", () => {
  it("explains browse history vs schedule cadence vs subscription destinations", () => {
    const model = buildDigestsBrowseScheduleSubscriptionsVocabulary();

    expect(model.heading).toBe(DIGESTS_BROWSE_SCHEDULE_SUBSCRIPTIONS_HEADING);
    expect(model.whyThree).toBe(DIGESTS_BROWSE_SCHEDULE_SUBSCRIPTIONS_WHY_THREE);
    expect(model.whyThree.toLowerCase()).toContain("history");
    expect(model.whyThree.toLowerCase()).toContain("cadence");
    expect(model.whyThree.toLowerCase()).toContain("destination");
    expect(model.compactLine).toBe(DIGESTS_BROWSE_SCHEDULE_SUBSCRIPTIONS_COMPACT_LINE);

    expect(model.browseLink.href).toBe(DIGESTS_BROWSE_TAB_PATH);
    expect(model.scheduleLink.href).toBe(DIGESTS_SCHEDULE_TAB_PATH);
    expect(model.subscriptionsLink.href).toBe(DIGESTS_SUBSCRIPTIONS_TAB_PATH);
  });

  it("resolves current and peer links for each Digests hub tab", () => {
    expect(resolveDigestsBrowseScheduleSubscriptionsLink("browse")).toEqual(
      DIGESTS_BROWSE_SCHEDULE_SUBSCRIPTIONS_BROWSE_LINK,
    );

    expect(resolveDigestsBrowseScheduleSubscriptionsPeerLinks("browse")).toEqual([
      DIGESTS_BROWSE_SCHEDULE_SUBSCRIPTIONS_SCHEDULE_LINK,
      DIGESTS_BROWSE_SCHEDULE_SUBSCRIPTIONS_SUBSCRIPTIONS_LINK,
    ]);

    expect(resolveDigestsBrowseScheduleSubscriptionsPeerLinks("schedule")).toEqual([
      DIGESTS_BROWSE_SCHEDULE_SUBSCRIPTIONS_BROWSE_LINK,
      DIGESTS_BROWSE_SCHEDULE_SUBSCRIPTIONS_SUBSCRIPTIONS_LINK,
    ]);

    expect(resolveDigestsBrowseScheduleSubscriptionsPeerLinks("subscriptions")).toEqual([
      DIGESTS_BROWSE_SCHEDULE_SUBSCRIPTIONS_BROWSE_LINK,
      DIGESTS_BROWSE_SCHEDULE_SUBSCRIPTIONS_SCHEDULE_LINK,
    ]);
  });
});
