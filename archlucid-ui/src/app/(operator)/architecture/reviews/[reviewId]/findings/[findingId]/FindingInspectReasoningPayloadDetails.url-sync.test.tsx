import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createElement, useSyncExternalStore, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { FINDING_INSPECT_REASONING_OPEN_PARAM } from "@/lib/findings/finding-inspect-reasoning-url";

import { FindingInspectReasoningPayloadDetails } from "./FindingInspectReasoningPayloadDetails";

const getFindingInspectMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api/findings-api", () => ({
  getFindingInspect: getFindingInspectMock,
}));

vi.mock("@/components/findings/FindingInspectJsonPayload", () => ({
  FindingInspectJsonPayload: ({ value }: { readonly value: unknown }) => (
    <div data-testid="finding-inspect-json-payload">{JSON.stringify(value)}</div>
  ),
}));

vi.mock("@/lib/resolve-production-eval-chrome-from-storage", () => ({
  resolveProductionEvalChromeFromStorage: () => false,
}));

const searchParamsHarness = vi.hoisted(() => {
  const listeners = new Set<() => void>();
  const state = { query: "" };

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
      state.query = "";
    },
  };
});

vi.mock("next/navigation", () => ({
  usePathname: () => "/architecture/reviews/run-1/findings/finding-1",
  useSearchParams: () => new URLSearchParams(searchParamsHarness.state.query),
  useRouter: () => ({ replace: vi.fn() }),
}));

function SearchParamsRerenderHost({ children }: { readonly children: ReactNode }) {
  useSyncExternalStore(
    searchParamsHarness.subscribe,
    () => searchParamsHarness.state.query,
    () => "",
  );

  return createElement("div", null, children);
}

describe("FindingInspectReasoningPayloadDetails URL sync", () => {
  beforeEach(() => {
    searchParamsHarness.reset();
    window.history.replaceState({}, "", "/architecture/reviews/run-1/findings/finding-1");
  });

  it("follows findingInspectReasoningOpen query changes without a popstate event", async () => {
    const renderDetails = () => (
      <SearchParamsRerenderHost>
        <FindingInspectReasoningPayloadDetails
          runId="run-1"
          findingId="finding-1"
          reasoningTrace="Step one then step two."
          typedPayload={{ severity: "High" }}
        />
      </SearchParamsRerenderHost>
    );

    const { rerender } = render(renderDetails());

    const reasoningDetails = () => screen.getByText("View AI Reasoning").closest("details") as HTMLDetailsElement;
    expect(reasoningDetails()).not.toHaveAttribute("open");

    act(() => {
      searchParamsHarness.applyQuery(`${FINDING_INSPECT_REASONING_OPEN_PARAM}=1`);
      window.history.replaceState(
        {},
        "",
        `/architecture/reviews/run-1/findings/finding-1?${FINDING_INSPECT_REASONING_OPEN_PARAM}=1`,
      );
    });
    rerender(renderDetails());

    await waitFor(() => {
      expect(reasoningDetails()).toHaveAttribute("open");
    });
  });

  it("does not commit a lazy payload response after navigating to another finding", async () => {
    let resolveRequest: ((value: { readonly typedPayload: unknown }) => void) | undefined;
    getFindingInspectMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRequest = resolve;
        }),
    );

    const renderDetails = (runId: string, findingId: string, typedPayload: unknown) => (
      <FindingInspectReasoningPayloadDetails
        runId={runId}
        findingId={findingId}
        reasoningTrace={null}
        typedPayload={typedPayload}
        lazyLoadTypedPayload
      />
    );

    const { rerender } = render(renderDetails("run-1", "finding-1", { label: "new finding" }));
    fireEvent.click(screen.getByText("AI Audit Inspection"));

    await waitFor(() => {
      expect(getFindingInspectMock).toHaveBeenCalledWith("run-1", "finding-1", { includeTypedPayload: true });
    });

    rerender(renderDetails("run-2", "finding-2", { label: "next finding" }));
    resolveRequest?.({ typedPayload: { label: "old finding payload" } });

    await waitFor(() => {
      expect(screen.queryByText('{"label":"old finding payload"}')).not.toBeInTheDocument();
      expect(screen.getByText("Expand to load the full structured evaluation payload.")).toBeInTheDocument();
    });
  });
});
