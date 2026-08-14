import { describe, expect, it } from "vitest";

import {
  NOTIFICATION_PREFERENCE_CENTER_PAGE_TITLE,
  NOTIFICATION_PREFERENCE_CHANNELS,
} from "@/lib/notification-preference-center";
import {
  NOTIFICATIONS_HELP_CLAIM_DISCIPLINE,
  NOTIFICATIONS_HELP_SOURCES,
} from "@/lib/notifications-help-evidence-copy";
import {
  NOTIFICATIONS_HELP_GUIDE_HEADINGS,
  NOTIFICATIONS_HELP_HOW_TO_READ_STEPS,
  NOTIFICATIONS_HELP_NEGATION_DRIFT_MARKERS,
  NOTIFICATIONS_HELP_OVERVIEW,
  NOTIFICATIONS_HELP_PAGE_SUBTITLE,
  NOTIFICATIONS_HELP_PAGE_TITLE,
  NOTIFICATIONS_HELP_PRIMARY_ACTION,
  NOTIFICATIONS_HELP_START_HERE_CARD_TITLE,
  NOTIFICATIONS_HELP_TILE_ITEMS,
} from "@/lib/notifications-help-guide-content";

describe("notifications help drift guard", () => {
  it("keeps overview and steps free of delivery-status overclaim", () => {
    for (const phrase of NOTIFICATIONS_HELP_NEGATION_DRIFT_MARKERS.overviewMustNotContain) {
      expect(NOTIFICATIONS_HELP_OVERVIEW, `overview must not contain "${phrase}"`).not.toContain(phrase);
    }

    for (const step of NOTIFICATIONS_HELP_HOW_TO_READ_STEPS) {
      for (const phrase of NOTIFICATIONS_HELP_NEGATION_DRIFT_MARKERS.stepsMustNotContain) {
        expect(step, `step must not contain "${phrase}"`).not.toContain(phrase);
      }
    }
  });

  it("keeps claim discipline free of Sources package jargon", () => {
    expect(NOTIFICATIONS_HELP_CLAIM_DISCIPLINE.toLowerCase()).not.toContain("sources package");
  });

  it("keeps help page title distinct from the product hub title", () => {
    expect(NOTIFICATIONS_HELP_PAGE_TITLE).not.toBe(NOTIFICATION_PREFERENCE_CENTER_PAGE_TITLE);
  });

  it("uses distinct Start here card title and primary action label", () => {
    expect(NOTIFICATIONS_HELP_START_HERE_CARD_TITLE).not.toBe(NOTIFICATIONS_HELP_PRIMARY_ACTION.label);
  });

  it("keeps overview distinct from the page subtitle", () => {
    expect(NOTIFICATIONS_HELP_OVERVIEW).not.toBe(NOTIFICATIONS_HELP_PAGE_SUBTITLE);
  });

  it("lists five guide headings so the topic rail renders at xl", () => {
    expect(NOTIFICATIONS_HELP_GUIDE_HEADINGS).toHaveLength(5);
    expect(NOTIFICATIONS_HELP_GUIDE_HEADINGS[2]?.id).toBe("notification-worked-examples");
    expect(
      NOTIFICATIONS_HELP_GUIDE_HEADINGS.some((heading) => heading.id === "help-notifications-claim-discipline-heading"),
    ).toBe(true);
  });

  it("matches tile count and hrefs to notification preference channels", () => {
    expect(NOTIFICATIONS_HELP_TILE_ITEMS).toHaveLength(NOTIFICATION_PREFERENCE_CHANNELS.length);

    for (let index = 0; index < NOTIFICATION_PREFERENCE_CHANNELS.length; index++) {
      const channel = NOTIFICATION_PREFERENCE_CHANNELS[index];
      const tile = NOTIFICATIONS_HELP_TILE_ITEMS[index];

      expect(tile?.label).toBe(channel?.title);
      expect(tile?.href).toBe(channel?.href);
    }
  });

  it("lists notifications help sources with unique hrefs", () => {
    const sourceHrefs = NOTIFICATIONS_HELP_SOURCES.map((source) => source.href);

    expect(new Set(sourceHrefs).size).toBe(sourceHrefs.length);
    expect(NOTIFICATIONS_HELP_SOURCES.every((source) => source.href.startsWith("/"))).toBe(true);
  });
});
