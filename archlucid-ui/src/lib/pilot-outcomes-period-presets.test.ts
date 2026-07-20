import { describe, expect, it } from "vitest";

import { resolvePilotOutcomesPeriodPreset } from "@/lib/pilot-outcomes-period-presets";

describe("resolvePilotOutcomesPeriodPreset", () => {
  const anchor = new Date("2026-04-15T12:00:00.000Z");

  it("resolves last-30 and last-90 day windows", () => {
    const last30 = resolvePilotOutcomesPeriodPreset("last-30", anchor);
    const last90 = resolvePilotOutcomesPeriodPreset("last-90", anchor);

    expect(last30.toUtc).toBe("2026-04-15T12:00");
    expect(last30.fromUtc.startsWith("2026-03-")).toBe(true);
    expect(last90.fromUtc.startsWith("2026-01-")).toBe(true);
  });

  it("resolves current and previous quarter boundaries", () => {
    const current = resolvePilotOutcomesPeriodPreset("current-quarter", anchor);
    const previous = resolvePilotOutcomesPeriodPreset("previous-quarter", anchor);

    expect(current.fromUtc).toBe("2026-04-01T00:00");
    expect(previous.fromUtc).toBe("2026-01-01T00:00");
    expect(previous.toUtc).toBe("2026-04-01T00:00");
  });
});
