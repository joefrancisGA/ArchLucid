import { useSyncExternalStore } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { OperatorHomeInFlightReviewsSection } from "@/components/operator-home/OperatorHomeInFlightReviewsSection";
import { getArchitectureIdentity } from "@/lib/api/architecture-identity-api";
import { getOperation } from "@/lib/api/operations-api";
import {
  getInFlightOperations,
  resetInFlightOperationsForTests,
  subscribeInFlightOperations,
} from "@/lib/operations/in-flight-operations-store";

vi.mock("@/hooks/use-shell-in-flight-operations", () => ({
  useShellInFlightOperations: () =>
    useSyncExternalStore(subscribeInFlightOperations, getInFlightOperations, getInFlightOperations),
  SHELL_IN_FLIGHT_POLL_MS: 2000,
  SHELL_IN_FLIGHT_TERMINAL_HOLD_MS: 8000,
}));

vi.mock("@/lib/api/architecture-identity-api", () => ({
  getArchitectureIdentity: vi.fn(),
}));

vi.mock("@/lib/api/operations-api", () => ({
  getOperation: vi.fn(),
}));

vi.mock("@/lib/desk-continuity-preference", () => ({
  readCachedLastOpenArchitectureId: () => "arch-home",
}));

vi.mock("@/lib/operator/operator-scope-storage", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/operator/operator-scope-storage")>();

  return {
    ...actual,
    readOperatorScopeFromStorage: () => ({
      tenantId: "tenant-a",
      workspaceId: "workspace-a",
      projectId: "project-a",
      workspaceLabel: "Workspace",
      projectLabel: "Project",
    }),
  };
});

vi.mock("@/lib/operator/operator-static-demo", () => ({
  isStaticDemoPayloadFallbackEnabled: () => false,
}));

describe("OperatorHomeInFlightReviewsSection (CA-46)", () => {
  beforeEach(() => {
    resetInFlightOperationsForTests();
    window.sessionStorage.clear();
    vi.mocked(getArchitectureIdentity).mockReset();
    vi.mocked(getOperation).mockReset();
  });

  afterEach(() => {
    resetInFlightOperationsForTests();
    window.sessionStorage.clear();
  });

  it("shows the Working in-flight strip after server rehydrate with empty sessionStorage", async () => {
    vi.mocked(getArchitectureIdentity).mockResolvedValue({
      architectureId: "arch-home",
      displayName: "Payments",
      draftCount: 0,
      reviewCount: 1,
      createdUtc: "2026-01-01T00:00:00.000Z",
      updatedUtc: "2026-01-01T00:00:00.000Z",
      drafts: [],
      reviews: [{ runId: "run-active", createdUtc: "2026-01-01T00:00:00.000Z" }],
    });
    vi.mocked(getOperation).mockResolvedValue({
      operationId: "run:run-active",
      state: "Running",
      stepLabel: "Analyzing",
      heartbeatUtc: "2026-01-01T00:01:00.000Z",
      resultRef: { runId: "run-active", jobId: null, downloadPath: null },
    });

    render(<OperatorHomeInFlightReviewsSection />);

    expect(await screen.findByTestId("operator-home-in-flight-reviews")).toBeInTheDocument();
    expect(await screen.findByTestId("operator-home-in-flight-open-run:run-active")).toBeInTheDocument();
  });
});
