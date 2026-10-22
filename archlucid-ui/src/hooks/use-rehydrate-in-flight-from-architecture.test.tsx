import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  useRehydrateInFlightFromWorkingContinuity,
  useRehydrateInFlightOperationsFromArchitecture,
} from "@/hooks/use-rehydrate-in-flight-from-architecture";
import { rehydrateInFlightOperationsFromArchitecture } from "@/lib/operations/rehydrate-in-flight-from-architecture";
import { ARCHLUCID_OPERATOR_SCOPE_CHANGED_EVENT } from "@/lib/operator/operator-scope-storage";

vi.mock("@/lib/operations/rehydrate-in-flight-from-architecture", () => ({
  rehydrateInFlightOperationsFromArchitecture: vi.fn(async () => 0),
}));

vi.mock("@/lib/desk-continuity-preference", () => ({
  readCachedLastOpenArchitectureId: vi.fn(() => "arch-working"),
}));

vi.mock("@/lib/operator/operator-scope-storage", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/operator/operator-scope-storage")>();

  return {
    ...actual,
    readOperatorScopeFromStorage: vi.fn(() => ({
      tenantId: "tenant-a",
      workspaceId: "workspace-a",
      projectId: "project-a",
      workspaceLabel: "Workspace",
      projectLabel: "Project",
    })),
  };
});

describe("useRehydrateInFlightOperationsFromArchitecture (CA-46)", () => {
  beforeEach(() => {
    vi.mocked(rehydrateInFlightOperationsFromArchitecture).mockClear();
  });

  afterEach(() => {
    vi.mocked(rehydrateInFlightOperationsFromArchitecture).mockClear();
  });

  it("rehydrates on desk mount for the architecture id", async () => {
    renderHook(() => useRehydrateInFlightOperationsFromArchitecture("arch-desk"));

    await waitFor(() => {
      expect(rehydrateInFlightOperationsFromArchitecture).toHaveBeenCalledWith({
        tenantId: "tenant-a",
        workspaceId: "workspace-a",
        projectId: "project-a",
        architectureId: "arch-desk",
      });
    });
  });

  it("re-runs after operator scope changes while the desk stays mounted", async () => {
    renderHook(() => useRehydrateInFlightOperationsFromArchitecture("arch-desk"));

    await waitFor(() => {
      expect(rehydrateInFlightOperationsFromArchitecture).toHaveBeenCalledTimes(1);
    });

    window.dispatchEvent(new CustomEvent(ARCHLUCID_OPERATOR_SCOPE_CHANGED_EVENT));

    await waitFor(() => {
      expect(rehydrateInFlightOperationsFromArchitecture).toHaveBeenCalledTimes(2);
    });
  });
});

describe("useRehydrateInFlightFromWorkingContinuity (CA-46)", () => {
  beforeEach(() => {
    vi.mocked(rehydrateInFlightOperationsFromArchitecture).mockClear();
  });

  it("rehydrates the last-open architecture for Working shell strips", async () => {
    renderHook(() => useRehydrateInFlightFromWorkingContinuity());

    await waitFor(() => {
      expect(rehydrateInFlightOperationsFromArchitecture).toHaveBeenCalledWith(
        expect.objectContaining({ architectureId: "arch-working" }),
      );
    });
  });
});
