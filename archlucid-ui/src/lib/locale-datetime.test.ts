import { describe, expect, it } from "vitest";

import {
  formatBrowserTimeZoneAbbreviation,
  formatIanaTimeZoneAbbreviation,
  formatInstantForLocale,
} from "@/lib/locale-datetime";
import { pilotOutcomesReportingPeriodHelper } from "@/lib/pilot-outcomes-page-copy";

describe("formatInstantForLocale", () => {
  it("returns locale string for valid ISO input", () => {
    const s = formatInstantForLocale("2026-01-15T14:30:00.000Z");

    expect(s).not.toMatch(/invalid/i);
    expect(s.length).toBeGreaterThan(4);
  });

  it("returns em dash for empty or invalid input", () => {
    expect(formatInstantForLocale("")).toBe(" — ");
    expect(formatInstantForLocale("not-a-date")).toBe(" — ");
    expect(formatInstantForLocale(null)).toBe(" — ");
    expect(formatInstantForLocale(undefined)).toBe(" — ");
  });
});

describe("formatIanaTimeZoneAbbreviation", () => {
  it("returns a short zone label instead of the IANA id for Eastern Time", () => {
    const winter = new Date("2026-01-15T12:00:00.000Z");
    const summer = new Date("2026-08-15T12:00:00.000Z");

    expect(formatIanaTimeZoneAbbreviation("America/New_York", winter)).toBe("EST");
    expect(formatIanaTimeZoneAbbreviation("America/New_York", summer)).toBe("EDT");
  });

  it("falls back to the IANA id when Intl cannot resolve the zone", () => {
    expect(formatIanaTimeZoneAbbreviation("Not/A_RealZone")).toBe("Not/A_RealZone");
  });
});

describe("formatBrowserTimeZoneAbbreviation", () => {
  it("returns a short abbreviation", () => {
    const label = formatBrowserTimeZoneAbbreviation();

    expect(label.length).toBeGreaterThan(0);
    expect(label).not.toContain("/");
  });
});

describe("pilotOutcomesReportingPeriodHelper", () => {
  it("describes inclusive start and exclusive end instants", () => {
    const helper = pilotOutcomesReportingPeriodHelper("EDT");

    expect(helper).toContain("Times shown in EDT");
    expect(helper).toContain("start time is inclusive");
    expect(helper).toContain("end time is exclusive");
    expect(helper).not.toContain("end date");
  });
});
