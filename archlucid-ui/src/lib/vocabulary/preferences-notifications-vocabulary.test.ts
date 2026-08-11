import { describe, expect, it } from "vitest";

import {
  PREFERENCES_NOTIFICATIONS_COMPACT_LINE,
  PREFERENCES_NOTIFICATIONS_HEADING,
  PREFERENCES_NOTIFICATIONS_NOTIFICATIONS_LINK,
  PREFERENCES_NOTIFICATIONS_PREFERENCES_LINK,
  PREFERENCES_NOTIFICATIONS_WHY_TWO,
  buildPreferencesNotificationsVocabulary,
  resolvePreferencesNotificationsPeerLink,
} from "@/lib/vocabulary/preferences-notifications-vocabulary";
import {
  SETTINGS_NOTIFICATIONS_PATH,
  SETTINGS_PREFERENCES_PATH,
} from "@/lib/settings-admin-route-paths";

describe("preferences-notifications-vocabulary (TB-2295)", () => {
  it("explains appearance preferences vs notifications channel launcher", () => {
    const model = buildPreferencesNotificationsVocabulary();

    expect(model.heading).toBe(PREFERENCES_NOTIFICATIONS_HEADING);
    expect(model.whyTwo).toBe(PREFERENCES_NOTIFICATIONS_WHY_TWO);
    expect(model.whyTwo.toLowerCase()).toContain("theme");
    expect(model.whyTwo.toLowerCase()).toContain("channel");
    expect(model.compactLine).toBe(PREFERENCES_NOTIFICATIONS_COMPACT_LINE);

    expect(model.preferencesLink.href).toBe(SETTINGS_PREFERENCES_PATH);
    expect(model.notificationsLink.href).toBe(SETTINGS_NOTIFICATIONS_PATH);
  });

  it("resolves the peer surface from preferences and notifications", () => {
    expect(resolvePreferencesNotificationsPeerLink("preferences")).toEqual(
      PREFERENCES_NOTIFICATIONS_NOTIFICATIONS_LINK,
    );

    expect(resolvePreferencesNotificationsPeerLink("notifications")).toEqual(
      PREFERENCES_NOTIFICATIONS_PREFERENCES_LINK,
    );
  });
});
