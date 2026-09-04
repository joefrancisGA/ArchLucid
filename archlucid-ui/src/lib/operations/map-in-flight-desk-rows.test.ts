import { describe, expect, it } from "vitest";

import type { TrackedInFlightOperation } from "@/lib/operations/in-flight-operations-store";

import {
  buildInFlightDeskHref,
  collectInFlightReviewRunIds,
  IN_FLIGHT_DESK_ANALYSIS_RUNNING_DETAIL,
  isVisibleInFlightDeskOperation,
  mapInFlightOperationToDeskRow,
  mapInFlightOperationsToDeskRows,
} from "@/lib/operations/map-in-flight-desk-rows";

function operation(overrides: Partial<TrackedInFlightOperation> = {}): TrackedInFlightOperation {
  return {
    operationId: "run:abc",
    title: "Architecture review analysis",
    href: "/architecture/reviews/abc",
    startedAtMs: 1_700_000_000_000,
    stepLabel: "Agents running",
    state: "Running",
    runId: "abc",
    architectureId: null,
    retainUntilConsumed: false,
    terminalToastShown: false,
    ...overrides,
  };
}

describe("map-in-flight-desk-rows (LI-08)", () => {
  it("keeps active and retain-until-consumed rows visible", () => {
    expect(isVisibleInFlightDeskOperation(operation({ state: "Running" }))).toBe(true);
    expect(
      isVisibleInFlightDeskOperation(
        operation({ state: "Succeeded", retainUntilConsumed: true }),
      ),
    ).toBe(true);
    expect(isVisibleInFlightDeskOperation(operation({ state: "Succeeded" }))).toBe(false);
  });

  it("deep links review operations to Activity with reviewTab", () => {
    const href = buildInFlightDeskHref(operation());

    expect(href).toContain("/architecture/reviews/abc");
    expect(href).toContain("reviewTab=activity");
    expect(href).not.toContain("%");
  });

  it("preserves non-review hrefs when runId is absent", () => {
    const href = buildInFlightDeskHref(
      operation({
        runId: null,
        href: "/architecture/architectures/draft-1",
        operationId: "op:draft",
      }),
    );

    expect(href).toBe("/architecture/architectures/draft-1");
    expect(href).not.toContain("reviewTab=");
  });

  it("maps discrete step labels without fake percentages", () => {
    const row = mapInFlightOperationToDeskRow(operation({ stepLabel: "Queued" }));

    expect(row.statusLabel).toBe("Queued");
    expect(row.stepLabel).toBe("Queued");
    expect(row.detailLine).toBe(IN_FLIGHT_DESK_ANALYSIS_RUNNING_DETAIL);
    expect(row.detailLine).not.toMatch(/%/);
    expect(row.href).toContain("reviewTab=activity");
  });

  it("orders hub inventory helpers from active review run ids", () => {
    const rows = mapInFlightOperationsToDeskRows([
      operation({ runId: "one", operationId: "run:one" }),
      operation({ runId: "two", operationId: "run:two", state: "Succeeded" }),
      operation({
        runId: "three",
        operationId: "run:three",
        state: "Succeeded",
        retainUntilConsumed: true,
      }),
    ]);

    expect(rows).toHaveLength(2);
    expect(collectInFlightReviewRunIds([
      operation({ runId: "one", operationId: "run:one" }),
      operation({ runId: "two", operationId: "run:two", state: "Failed" }),
    ])).toEqual(new Set(["one"]));
  });
});
