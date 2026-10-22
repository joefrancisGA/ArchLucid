import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  clearInFlightOperations,
  getInFlightOperations,
  hydrateInFlightOperationsFromStorage,
  resetInFlightOperationsForTests,
  trackInFlightOperation,
} from "@/lib/operations/in-flight-operations-store";
import {
  IN_FLIGHT_OPERATION_MAX_PERSISTED_AGE_MS,
  readPersistedInFlightOperations,
  writePersistedInFlightOperations,
} from "@/lib/operations/in-flight-operations-persistence";

function persistedRow(overrides: Record<string, unknown>): Record<string, unknown> {
  return {
    operationId: "run:abc",
    title: "Architecture review analysis",
    href: "/architecture/reviews/abc",
    startedAtMs: Date.now(),
    stepLabel: "Queued",
    state: "Running",
    runId: "abc",
    terminalToastShown: false,
    ...overrides,
  };
}

function seedStorage(rows: readonly Record<string, unknown>[]): void {
  // Mirrors the scope-namespaced key the persistence module writes under.
  window.sessionStorage.setItem(
    "archlucid_in_flight_operations_v1:||",
    JSON.stringify(rows),
  );
}

describe("in-flight operations persistence", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    resetInFlightOperationsForTests();
  });

  afterEach(() => {
    window.sessionStorage.clear();
    resetInFlightOperationsForTests();
  });

  it("restores a tracked operation after a reload", () => {
    trackInFlightOperation({
      operationId: "run:abc",
      title: "Architecture review analysis",
      href: "/architecture/reviews/abc",
      runId: "abc",
    });

    const persisted = readPersistedInFlightOperations();
    expect(persisted).toHaveLength(1);

    // Simulate a reload: module state is gone but sessionStorage survives.
    resetInFlightOperationsForTests();
    writePersistedInFlightOperations(persisted);
    hydrateInFlightOperationsFromStorage();

    expect(getInFlightOperations()).toHaveLength(1);
    expect(getInFlightOperations()[0]?.operationId).toBe("run:abc");
  });

  it("restores architectureId and retainUntilConsumed from storage", () => {
    trackInFlightOperation({
      operationId: "draft:11111111-1111-1111-1111-111111111111",
      title: "Structured brief suggestions",
      href: "/architecture/architectures/arch-001",
      architectureId: "arch-001",
      retainUntilConsumed: true,
    });

    const persisted = readPersistedInFlightOperations();
    expect(persisted[0]?.architectureId).toBe("arch-001");
    expect(persisted[0]?.retainUntilConsumed).toBe(true);

    resetInFlightOperationsForTests();
    writePersistedInFlightOperations(persisted);
    hydrateInFlightOperationsFromStorage();

    expect(getInFlightOperations()[0]?.retainUntilConsumed).toBe(true);
    expect(getInFlightOperations()[0]?.architectureId).toBe("arch-001");
  });

  it("does not duplicate an operation already tracked in memory", () => {
    trackInFlightOperation({
      operationId: "run:abc",
      title: "Architecture review analysis",
      href: "/architecture/reviews/abc",
      runId: "abc",
    });

    hydrateInFlightOperationsFromStorage();

    expect(getInFlightOperations()).toHaveLength(1);
  });

  it("drops rows older than the persisted age ceiling", () => {
    seedStorage([
      persistedRow({
        startedAtMs: Date.now() - IN_FLIGHT_OPERATION_MAX_PERSISTED_AGE_MS - 1_000,
      }),
    ]);

    expect(readPersistedInFlightOperations()).toHaveLength(0);
  });

  it("rejects an absolute href so a tampered entry cannot become an open redirect", () => {
    seedStorage([persistedRow({ href: "https://evil.example.com/steal" })]);

    expect(readPersistedInFlightOperations()).toHaveLength(0);
  });

  it("rejects a protocol-relative href", () => {
    seedStorage([persistedRow({ href: "//evil.example.com/steal" })]);

    expect(readPersistedInFlightOperations()).toHaveLength(0);
  });

  it("clears memory and storage on scope switch or sign-out", () => {
    trackInFlightOperation({
      operationId: "run:abc",
      title: "Architecture review analysis",
      href: "/architecture/reviews/abc",
      runId: "abc",
    });

    clearInFlightOperations();

    expect(getInFlightOperations()).toHaveLength(0);
    expect(readPersistedInFlightOperations()).toHaveLength(0);
  });
});
