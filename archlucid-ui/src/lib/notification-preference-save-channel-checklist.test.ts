import { describe, expect, it } from "vitest";

import {
  resolveNotificationPreferenceSaveChannelEmphasizedStepId,
  resolveNotificationPreferenceSaveChannelSteps,
} from "@/lib/notification-preference-save-channel-checklist";

describe("notification-preference-save-channel-checklist", () => {
  it("tracks save channel progress", () => {
    expect(
      resolveNotificationPreferenceSaveChannelSteps({
        channelsReviewed: true,
        primaryChannelsReady: false,
        allChannelsReady: false,
      }),
    ).toEqual([
      { id: "review", label: "Review each notification channel status", complete: true },
      { id: "primary", label: "Save primary channel configuration", complete: false },
      { id: "all", label: "Confirm all channels are connected", complete: false },
    ]);
  });

  it("emphasizes primary when missing", () => {
    expect(
      resolveNotificationPreferenceSaveChannelEmphasizedStepId({
        channelsReviewed: true,
        primaryChannelsReady: false,
        allChannelsReady: false,
      }),
    ).toBe("primary");
  });
});
