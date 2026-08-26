import { describe, expect, it } from "vitest";

import {
  formatIanaTimeZoneClosedLabel,
  formatIanaTimeZoneFriendlyTitle,
  formatIanaTimeZoneUtcOffsetLabel,
  listIanaTimeZoneDisplayEntries,
  resolveIanaTimeZoneDisplayEntry,
  searchIanaTimeZoneDisplayEntries,
} from "@/lib/iana-time-zone-display";

describe("iana-time-zone-display", () => {
  const summerInstant = new Date("2026-07-20T16:00:00.000Z");

  it("formats curated US zones with friendly titles", () => {
    expect(formatIanaTimeZoneFriendlyTitle("America/New_York")).toBe("Eastern Time — New York");
    expect(formatIanaTimeZoneFriendlyTitle("America/Chicago")).toBe("Central Time — Chicago");
    expect(formatIanaTimeZoneFriendlyTitle("America/Los_Angeles")).toBe("Pacific Time — Los Angeles");
  });

  it("formats closed labels with the current UTC offset", () => {
    expect(formatIanaTimeZoneClosedLabel("America/New_York", summerInstant)).toMatch(
      /^Eastern Time — New York \(UTC[−+-]\d{2}:\d{2}\)$/,
    );
  });

  it("formats UTC offsets for search and display", () => {
    expect(formatIanaTimeZoneUtcOffsetLabel("UTC", summerInstant)).toBe("UTC+00:00");
    expect(formatIanaTimeZoneUtcOffsetLabel("America/New_York", summerInstant)).toMatch(/^UTC[−+-]\d{2}:\d{2}$/);
  });

  it("matches cities, abbreviations, offsets, and IANA ids", () => {
    const entries = listIanaTimeZoneDisplayEntries(summerInstant);

    expect(
      searchIanaTimeZoneDisplayEntries("Boston", entries).some(
        (entry) => entry.ianaTimeZoneId === "America/New_York",
      ),
    ).toBe(true);
    expect(
      searchIanaTimeZoneDisplayEntries("Eastern", entries).some(
        (entry) => entry.ianaTimeZoneId === "America/New_York",
      ),
    ).toBe(true);
    expect(
      searchIanaTimeZoneDisplayEntries("America/New_York", entries).some(
        (entry) => entry.ianaTimeZoneId === "America/New_York",
      ),
    ).toBe(true);
    expect(
      searchIanaTimeZoneDisplayEntries("EST", entries).some((entry) => entry.ianaTimeZoneId === "America/New_York"),
    ).toBe(true);
  });

  it("indexes offsets for queries like UTC-5", () => {
    const entry = resolveIanaTimeZoneDisplayEntry("America/New_York", summerInstant);

    expect(entry.searchIndex).toContain("america/new_york");
    expect(entry.searchIndex).toContain("utc-04:00");
    expect(entry.searchIndex).toContain("utc-0400");
  });
});
