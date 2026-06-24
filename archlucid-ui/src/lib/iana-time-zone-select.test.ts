import { describe, expect, it } from "vitest";

import {
  formatIanaTimeZoneOptionLabel,
  getIanaTimeZoneSelectOptions,
  normalizeIanaTimeZoneForSelect,
  toStoredIanaTimeZoneId,
} from "./iana-time-zone-select";

describe("iana-time-zone-select", () => {
  it("normalizes UTC aliases for the select control", () => {
    expect(normalizeIanaTimeZoneForSelect("UTC")).toBe("Etc/UTC");
    expect(normalizeIanaTimeZoneForSelect("Africa/Abidjan")).toBe("Etc/UTC");
    expect(normalizeIanaTimeZoneForSelect("America/New_York")).toBe("America/New_York");
  });

  it("formats UTC aliases as UTC", () => {
    expect(formatIanaTimeZoneOptionLabel("Etc/UTC")).toBe("UTC");
    expect(formatIanaTimeZoneOptionLabel("Africa/Abidjan")).toBe("UTC");
    expect(formatIanaTimeZoneOptionLabel("America/Chicago")).toBe("America/Chicago");
  });

  it("stores canonical UTC for API persistence", () => {
    expect(toStoredIanaTimeZoneId("Etc/UTC")).toBe("UTC");
    expect(toStoredIanaTimeZoneId("Africa/Abidjan")).toBe("UTC");
    expect(toStoredIanaTimeZoneId("America/Denver")).toBe("America/Denver");
  });

  it("lists UTC first without duplicate UTC aliases", () => {
    const options = getIanaTimeZoneSelectOptions();

    expect(options[0]).toEqual({ value: "Etc/UTC", label: "UTC" });
    expect(options.some((option) => option.value === "Africa/Abidjan")).toBe(false);
    expect(options.some((option) => option.label === "UTC" && option.value !== "Etc/UTC")).toBe(false);
  });
});
