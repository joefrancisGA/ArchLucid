import { describe, expect, it } from "vitest";

import {
  formatProbeDuration,
  healthGroupCountLabel,
  healthyRowCount,
  slowestProbeMs,
  worstRowDisplayStatus,
} from "@/lib/health-group-metrics";
import { presentReadinessRow } from "@/lib/health-readiness-presentation";

const healthyRow = presentReadinessRow("database", "Healthy", 12);
const slowHealthyRow = presentReadinessRow("openai", "Healthy", 240);
const degradedRow = presentReadinessRow("blob_storage", "Degraded");
const skippedRow = presentReadinessRow("redis", "Skipped");
const failingRow = presentReadinessRow("keyvault", "Unhealthy");

describe("healthyRowCount", () => {
  it("counts only healthy severities", () => {
    expect(healthyRowCount([healthyRow, degradedRow, skippedRow])).toBe(1);
  });
});

describe("healthGroupCountLabel", () => {
  it("reports passing over total", () => {
    expect(healthGroupCountLabel([healthyRow, slowHealthyRow, degradedRow])).toBe("2 of 3 passing");
  });

  it("does not claim a passing count when nothing was reported", () => {
    expect(healthGroupCountLabel([])).toBe("No checks reported");
  });
});

describe("slowestProbeMs", () => {
  it("returns the highest reported duration", () => {
    expect(slowestProbeMs([healthyRow, slowHealthyRow])).toBe(240);
  });

  it("returns null when no probe reported a duration", () => {
    expect(slowestProbeMs([degradedRow, skippedRow])).toBeNull();
  });
});

describe("formatProbeDuration", () => {
  it("formats milliseconds", () => {
    expect(formatProbeDuration(240)).toBe("240 ms");
  });

  it("says so when latency is absent rather than showing a dash", () => {
    expect(formatProbeDuration(null)).toBe("Not reported");
  });
});

describe("worstRowDisplayStatus", () => {
  it("surfaces the worst check so the group chip keeps the blocking palette", () => {
    expect(worstRowDisplayStatus([healthyRow, skippedRow, degradedRow, failingRow])).toBe("Failing");
  });

  it("reports Healthy when every check passes", () => {
    expect(worstRowDisplayStatus([healthyRow, slowHealthyRow])).toBe("Healthy");
  });

  it("falls back to Unknown for an empty group", () => {
    expect(worstRowDisplayStatus([])).toBe("Unknown");
  });
});
