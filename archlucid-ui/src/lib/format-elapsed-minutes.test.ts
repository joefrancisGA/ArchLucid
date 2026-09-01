import { describe, expect, it } from "vitest";

import { formatElapsedMinutesProse } from "@/lib/format-elapsed-minutes";

describe("formatElapsedMinutesProse", () => {
  it("uses minutes for durations under one hour", () => {
    expect(formatElapsedMinutesProse(0)).toBe("0 minutes");
    expect(formatElapsedMinutesProse(1)).toBe("1 minute");
    expect(formatElapsedMinutesProse(59)).toBe("59 minutes");
  });

  it("uses hours for durations from one hour up to 47 hours", () => {
    expect(formatElapsedMinutesProse(60)).toBe("1 hour");
    expect(formatElapsedMinutesProse(90)).toBe("1 hour");
    expect(formatElapsedMinutesProse(120)).toBe("2 hours");
    expect(formatElapsedMinutesProse(2812)).toBe("46 hours");
    expect(formatElapsedMinutesProse(1440)).toBe("24 hours");
    expect(formatElapsedMinutesProse(2879)).toBe("47 hours");
  });

  it("uses days for durations of at least two days", () => {
    expect(formatElapsedMinutesProse(2880)).toBe("2 days");
    expect(formatElapsedMinutesProse(4320)).toBe("3 days");
  });
});
