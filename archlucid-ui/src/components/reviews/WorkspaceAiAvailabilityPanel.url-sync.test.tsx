import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createElement, useSyncExternalStore, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { WORKSPACE_AI_PROBE_DIAGNOSTICS_OPEN_PARAM } from "@/lib/reviews/workspace-ai-probe-diagnostics-disclosure-url";

import { WorkspaceAiAvailabilityPanel } from "./WorkspaceAiAvailabilityPanel";

const searchParamsHarness = vi.hoisted(() => {
  const listeners = new Set<() => void>();
  const state = { query: "reviewTab=overview" };

  return {
    state,
    subscribe(listener: () => void): () => void {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
    applyQuery(query: string): void {
      state.query = query;

      for (const listener of listeners) {
        listener();
      }
    },
    reset(): void {
      state.query = "reviewTab=overview";
    },
  };
});

vi.mock("next/navigation", () => ({
  usePathname: () => "/architecture/reviews/run-abc",
  useSearchParams: () => new URLSearchParams(searchParamsHarness.state.query),
}));

const loadedAvailableResult = {
  isAvailable: true,
  validated: true,
  aiSource: "managed-platform",
  summary: "ArchLucid-managed AI is available.",
  asOfUtc: "2026-08-31T18:00:00.000Z",
  checks: [
    {
      name: "azure_openai_live_completion_probe",
      status: "ok",
      detail: "",
    },
  ],
  debug: {},
};

function SearchParamsRerenderHost({ children }: { readonly children: ReactNode }) {
  useSyncExternalStore(
    searchParamsHarness.subscribe,
    () => searchParamsHarness.state.query,
    () => "reviewTab=overview",
  );

  return createElement("div", null, children);
}

describe("WorkspaceAiAvailabilityPanel URL sync", () => {
  beforeEach(() => {
    searchParamsHarness.reset();
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?reviewTab=overview");
  });

  it("writes workspace AI probe diagnostics disclosure from useSearchParams when window.location.search lags after soft navigation", async () => {
    window.history.replaceState(
      {},
      "",
      "/architecture/reviews/run-abc?reviewTab=findings&q=stale-payment",
    );

    const { rerender } = render(
      <SearchParamsRerenderHost>
        <WorkspaceAiAvailabilityPanel
          workspaceAiSignal={{ label: "Workspace AI", detail: "detail" }}
          availabilityCheck={{
            state: { status: "loaded", result: loadedAvailableResult },
            checkAvailability: vi.fn(),
          }}
        />
      </SearchParamsRerenderHost>,
    );

    searchParamsHarness.applyQuery("reviewTab=overview");
    rerender(
      <SearchParamsRerenderHost>
        <WorkspaceAiAvailabilityPanel
          workspaceAiSignal={{ label: "Workspace AI", detail: "detail" }}
          availabilityCheck={{
            state: { status: "loaded", result: loadedAvailableResult },
            checkAvailability: vi.fn(),
          }}
        />
      </SearchParamsRerenderHost>,
    );

    fireEvent.click(screen.getByRole("button", { name: /AI availability details/i }));

    await waitFor(() => {
      expect(window.location.pathname + window.location.search).toBe(
        `/architecture/reviews/run-abc?reviewTab=overview&${WORKSPACE_AI_PROBE_DIAGNOSTICS_OPEN_PARAM}=1`,
      );
    });
  });

  it("follows workspaceAiProbeDiagnosticsOpen query changes without a popstate event", async () => {
    const { rerender } = render(
      <SearchParamsRerenderHost>
        <WorkspaceAiAvailabilityPanel
          workspaceAiSignal={{ label: "Workspace AI", detail: "detail" }}
          availabilityCheck={{
            state: { status: "loaded", result: loadedAvailableResult },
            checkAvailability: vi.fn(),
          }}
        />
      </SearchParamsRerenderHost>,
    );

    const trigger = () => screen.getByRole("button", { name: /AI availability details/i });
    expect(trigger()).toHaveAttribute("aria-expanded", "false");

    searchParamsHarness.applyQuery(`reviewTab=overview&${WORKSPACE_AI_PROBE_DIAGNOSTICS_OPEN_PARAM}=1`);
    window.history.replaceState(
      {},
      "",
      `/architecture/reviews/run-abc?reviewTab=overview&${WORKSPACE_AI_PROBE_DIAGNOSTICS_OPEN_PARAM}=1`,
    );
    rerender(
      <SearchParamsRerenderHost>
        <WorkspaceAiAvailabilityPanel
          workspaceAiSignal={{ label: "Workspace AI", detail: "detail" }}
          availabilityCheck={{
            state: { status: "loaded", result: loadedAvailableResult },
            checkAvailability: vi.fn(),
          }}
        />
      </SearchParamsRerenderHost>,
    );

    await waitFor(() => {
      expect(trigger()).toHaveAttribute("aria-expanded", "true");
    });
  });
});
