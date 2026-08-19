import { describe, expect, it } from "vitest";

import { formatOperationElapsed } from "@/lib/operations/format-operation-elapsed";
import {
  parseOperationIdFromLocation,
  resolveOperationDetailHref,
} from "@/lib/operations/operation-location";
import {
  getInFlightOperations,
  patchInFlightOperation,
  removeInFlightOperation,
  resetInFlightOperationsForTests,
  trackInFlightOperation,
} from "@/lib/operations/in-flight-operations-store";
import {
  isTerminalOperationState,
  normalizeOperationState,
} from "@/lib/operations/operation-state";

describe("operation-location", () => {
  it("parses relative and absolute Location headers", () => {
    expect(parseOperationIdFromLocation("/v1/operations/run:abc")).toBe("run:abc");
    expect(
      parseOperationIdFromLocation("https://api.example/v1/operations/job%3Aguid-1?x=1"),
    ).toBe("job:guid-1");
    expect(parseOperationIdFromLocation(null)).toBeNull();
    expect(parseOperationIdFromLocation("/v1/jobs/x")).toBeNull();
  });

  it("resolves review href from runId", () => {
    expect(resolveOperationDetailHref("/fallback", "run-1")).toBe(
      "/architecture/reviews/run-1",
    );
    expect(resolveOperationDetailHref("/fallback", null)).toBe("/fallback");
  });
});

describe("formatOperationElapsed", () => {
  it("formats seconds and minutes without inventing percent", () => {
    expect(formatOperationElapsed(1_000, 1_000)).toBe("0s");
    expect(formatOperationElapsed(0, 45_000)).toBe("45s");
    expect(formatOperationElapsed(0, 125_000)).toBe("2m 05s");
  });
});

describe("operation-state", () => {
  it("treats Succeeded/Failed/Canceled as terminal", () => {
    expect(isTerminalOperationState("Running")).toBe(false);
    expect(isTerminalOperationState("CancelRequested")).toBe(false);
    expect(isTerminalOperationState("Succeeded")).toBe(true);
    expect(normalizeOperationState("CancelRequested")).toBe("CancelRequested");
    expect(normalizeOperationState(99)).toBe("Pending");
  });
});

describe("in-flight-operations-store", () => {
  it("tracks, patches, and removes operations idempotently", () => {
    resetInFlightOperationsForTests();

    trackInFlightOperation({
      operationId: "run:1",
      title: "Architecture review analysis",
      href: "/architecture/reviews/1",
      runId: "1",
    });

    expect(getInFlightOperations()).toHaveLength(1);
    expect(getInFlightOperations()[0]?.stepLabel).toBe("Queued");

    trackInFlightOperation({
      operationId: "run:1",
      title: "Architecture review analysis",
      href: "/architecture/reviews/1",
      stepLabel: "Should keep startedAt",
    });

    expect(getInFlightOperations()).toHaveLength(1);

    patchInFlightOperation("run:1", { stepLabel: "Agents running", state: "Running" });
    expect(getInFlightOperations()[0]?.stepLabel).toBe("Agents running");
    expect(getInFlightOperations()[0]?.state).toBe("Running");

    removeInFlightOperation("run:1");
    expect(getInFlightOperations()).toHaveLength(0);
  });
});
