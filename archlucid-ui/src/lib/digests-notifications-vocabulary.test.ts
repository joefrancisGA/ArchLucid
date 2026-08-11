import { describe, expect, it } from "vitest";

import {
  DIGESTS_NOTIFICATIONS_COMPACT_LINE,
  DIGESTS_NOTIFICATIONS_DIGESTS_LINK,
  DIGESTS_NOTIFICATIONS_HEADING,
  DIGESTS_NOTIFICATIONS_NOTIFICATIONS_LINK,
  DIGESTS_NOTIFICATIONS_WHY_TWO,
  buildDigestsNotificationsVocabulary,
  digestsNotificationsPreferenceCenterPath,
  resolveDigestsNotificationsPeerLink,
} from "@/lib/digests-notifications-vocabulary";
import { DIGESTS_HUB_PATH } from "@/lib/digests-route-paths";
import { NOTIFICATION_PREFERENCE_CENTER_PATH } from "@/lib/notification-preference-center";
import { SETTINGS_NOTIFICATIONS_PATH } from "@/lib/settings-admin-route-paths";

describe("digests-notifications-vocabulary (TB-2254)", () => {
  it("explains digests content cadence vs notifications preference launcher", () => {
    const model = buildDigestsNotificationsVocabulary();

    expect(model.heading).toBe(DIGESTS_NOTIFICATIONS_HEADING);
    expect(model.heading.toLowerCase()).toContain("digest");
    expect(model.heading.toLowerCase()).toContain("notification");
    expect(model.whyTwo).toBe(DIGESTS_NOTIFICATIONS_WHY_TWO);
    expect(model.whyTwo.toLowerCase()).toContain("content cadence");
    expect(model.whyTwo.toLowerCase()).toContain("preference launcher");
    expect(model.compactLine).toBe(DIGESTS_NOTIFICATIONS_COMPACT_LINE);

    expect(model.digestsLink).toEqual(DIGESTS_NOTIFICATIONS_DIGESTS_LINK);
    expect(model.digestsLink.href).toBe(DIGESTS_HUB_PATH);
    expect(model.digestsLink.href).toBe("/architecture/digests");

    expect(model.notificationsLink).toEqual(DIGESTS_NOTIFICATIONS_NOTIFICATIONS_LINK);
    expect(model.notificationsLink.href).toBe(SETTINGS_NOTIFICATIONS_PATH);
    expect(model.notificationsLink.href).toBe(NOTIFICATION_PREFERENCE_CENTER_PATH);
    expect(digestsNotificationsPreferenceCenterPath()).toBe(NOTIFICATION_PREFERENCE_CENTER_PATH);
  });

  it("resolves the peer surface from digests and notifications", () => {
    expect(resolveDigestsNotificationsPeerLink("digests")).toEqual(
      DIGESTS_NOTIFICATIONS_NOTIFICATIONS_LINK,
    );

    expect(resolveDigestsNotificationsPeerLink("notifications")).toEqual(
      DIGESTS_NOTIFICATIONS_DIGESTS_LINK,
    );
  });
});
