import { describe, expect, it } from "vitest";

import {
  findCircuitBreakersEntry,
  findHealthReadyEntryByName,
  isDataArchivalHealthDegraded,
  isHealthEntryStatusDegraded,
  parseCircuitGatesFromHealthEntry,
} from "./health-dashboard-types";

describe("parseCircuitGatesFromHealthEntry", () => {
  it("maps gates from circuit_breakers data payload", () => {
    const rows = parseCircuitGatesFromHealthEntry({
      gates: [
        {
          name: "openai completion",
          state: "Closed",
          breakDurationSeconds: 30,
        },
      ],
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.name).toBe("openai completion");
    expect(rows[0]?.state).toBe("Closed");
    expect(rows[0]?.breakDurationSeconds).toBe(30);
  });
});

describe("findCircuitBreakersEntry", () => {
  it("returns the named entry", () => {
    const e = findCircuitBreakersEntry([
      { name: "database", status: "Healthy" },
      { name: "circuit_breakers", status: "Healthy", data: { gates: [] } },
    ]);
    expect(e?.name).toBe("circuit_breakers");
  });
});

describe("findHealthReadyEntryByName", () => {
  it("returns the matching readiness entry", () => {
    const e = findHealthReadyEntryByName(
      [
        { name: "database", status: "Healthy" },
        { name: "data_archival", status: "Degraded" },
      ],
      "data_archival",
    );
    expect(e?.status).toBe("Degraded");
  });

  it("returns null when missing", () => {
    expect(findHealthReadyEntryByName([{ name: "database", status: "Healthy" }], "data_archival")).toBeNull();
  });
});

describe("isHealthEntryStatusDegraded", () => {
  it("matches Degraded case-insensitively", () => {
    expect(isHealthEntryStatusDegraded("Degraded")).toBe(true);
    expect(isHealthEntryStatusDegraded(" degraded ")).toBe(true);
    expect(isHealthEntryStatusDegraded("Healthy")).toBe(false);
  });
});

describe("isDataArchivalHealthDegraded", () => {
  it("is true only when data_archival entry is Degraded", () => {
    expect(
      isDataArchivalHealthDegraded([
        { name: "database", status: "Healthy" },
        { name: "data_archival", status: "Degraded" },
      ]),
    ).toBe(true);
  });

  it("is false when check is absent (disabled or non-worker host)", () => {
    expect(isDataArchivalHealthDegraded([{ name: "database", status: "Healthy" }])).toBe(false);
  });

  it("is false when archival is healthy (including disabled healthy)", () => {
    expect(isDataArchivalHealthDegraded([{ name: "data_archival", status: "Healthy" }])).toBe(false);
  });
});
