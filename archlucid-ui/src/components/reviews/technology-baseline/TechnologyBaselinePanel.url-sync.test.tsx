import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createElement, useSyncExternalStore, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TECHNOLOGY_BASELINE_EVIDENCE_REF_ENTRY_ID_PARAM } from "@/lib/reviews/technology-baseline-evidence-ref-disclosure-url";
import { TECHNOLOGY_BASELINE_ENTRY_PARAM } from "@/lib/reviews/technology-baseline-rationale-url";

import { TechnologyBaselinePanel } from "./TechnologyBaselinePanel";

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
  usePathname: () => "/architecture/reviews/dddddddd-dddd-dddd-dddd-dddddddddddd",
  useSearchParams: () => new URLSearchParams(searchParamsHarness.state.query),
}));

vi.mock("@/lib/api/technology-ledger", () => ({
  getTechnologyLedger: vi.fn(),
  patchTechnologyLedgerEntry: vi.fn(),
}));

import { getTechnologyLedger } from "@/lib/api/technology-ledger";

const mockGetTechnologyLedger = vi.mocked(getTechnologyLedger);

const runId = "dddddddd-dddd-dddd-dddd-dddddddddddd";

function SearchParamsRerenderHost({ children }: { readonly children: ReactNode }) {
  useSyncExternalStore(
    searchParamsHarness.subscribe,
    () => searchParamsHarness.state.query,
    () => "reviewTab=overview",
  );

  return createElement("div", null, children);
}

describe("TechnologyBaselinePanel URL sync", () => {
  beforeEach(() => {
    searchParamsHarness.reset();
    window.history.replaceState(
      {},
      "",
      `/architecture/reviews/${runId}?reviewTab=overview`,
    );
    mockGetTechnologyLedger.mockResolvedValue({
      runId: runId.replace(/-/g, ""),
      entries: [
        {
          entryId: "entry-assumed",
          runId: runId.replace(/-/g, ""),
          role: "PrimaryDatastore",
          technologyName: "Azure SQL Database",
          providerFamily: "Azure",
          status: "Assumed",
          source: "AgentProposed",
          evidenceRef: "agentTopologyProposal:demo:ds-1",
          rationale: "Proposed by the architecture-structure assessment.",
          isLocked: false,
          createdUtc: "2026-01-01T00:00:00.000Z",
          updatedUtc: "2026-01-01T00:00:00.000Z",
        },
      ],
    });
  });

  it("writes technology baseline evidence ref disclosure from useSearchParams when window.location.search lags after soft navigation", async () => {
    window.history.replaceState(
      {},
      "",
      `/architecture/reviews/${runId}?reviewTab=findings&q=stale-payment`,
    );

    const { rerender } = render(
      <SearchParamsRerenderHost>
        <TechnologyBaselinePanel
          runId={runId}
          manifestFinalized={false}
          buyerPolished={false}
          usedStaticDemoRun={false}
          warningCountDisplay={0}
        />
      </SearchParamsRerenderHost>,
    );

    await screen.findByText("Azure SQL Database");

    searchParamsHarness.applyQuery("reviewTab=overview");
    rerender(
      <SearchParamsRerenderHost>
        <TechnologyBaselinePanel
          runId={runId}
          manifestFinalized={false}
          buyerPolished={false}
          usedStaticDemoRun={false}
          warningCountDisplay={0}
        />
      </SearchParamsRerenderHost>,
    );

    fireEvent.click(screen.getByText("Evidence ref"));

    await waitFor(() => {
      expect(window.location.pathname + window.location.search).toBe(
        `/architecture/reviews/${runId}?reviewTab=overview&${TECHNOLOGY_BASELINE_EVIDENCE_REF_ENTRY_ID_PARAM}=entry-assumed`,
      );
    });
  });

  it("follows technologyBaselineEvidenceRefEntryId query changes without a popstate event", async () => {
    const { rerender } = render(
      <SearchParamsRerenderHost>
        <TechnologyBaselinePanel
          runId={runId}
          manifestFinalized={false}
          buyerPolished={false}
          usedStaticDemoRun={false}
          warningCountDisplay={0}
        />
      </SearchParamsRerenderHost>,
    );

    await screen.findByText("Azure SQL Database");

    const evidenceDetails = () => screen.getByText("Evidence ref").closest("details");
    expect(evidenceDetails()).not.toHaveAttribute("open");

    searchParamsHarness.applyQuery(
      `reviewTab=overview&${TECHNOLOGY_BASELINE_EVIDENCE_REF_ENTRY_ID_PARAM}=entry-assumed`,
    );
    window.history.replaceState(
      {},
      "",
      `/architecture/reviews/${runId}?reviewTab=overview&${TECHNOLOGY_BASELINE_EVIDENCE_REF_ENTRY_ID_PARAM}=entry-assumed`,
    );
    rerender(
      <SearchParamsRerenderHost>
        <TechnologyBaselinePanel
          runId={runId}
          manifestFinalized={false}
          buyerPolished={false}
          usedStaticDemoRun={false}
          warningCountDisplay={0}
        />
      </SearchParamsRerenderHost>,
    );

    await waitFor(() => {
      expect(evidenceDetails()).toHaveAttribute("open");
    });
  });

  it("closes the rationale dialog when techEntryId is removed from useSearchParams without a popstate event", async () => {
    searchParamsHarness.applyQuery(`reviewTab=overview&${TECHNOLOGY_BASELINE_ENTRY_PARAM}=entry-assumed`);
    window.history.replaceState(
      {},
      "",
      `/architecture/reviews/${runId}?reviewTab=overview&${TECHNOLOGY_BASELINE_ENTRY_PARAM}=entry-assumed`,
    );

    const { rerender } = render(
      <SearchParamsRerenderHost>
        <TechnologyBaselinePanel
          runId={runId}
          manifestFinalized={false}
          buyerPolished={false}
          usedStaticDemoRun={false}
          warningCountDisplay={0}
        />
      </SearchParamsRerenderHost>,
    );

    await screen.findByText("Azure SQL Database");

    await waitFor(() => {
      expect(screen.getByTestId("technology-baseline-rationale-dialog")).toBeInTheDocument();
    });

    searchParamsHarness.applyQuery("reviewTab=overview");
    rerender(
      <SearchParamsRerenderHost>
        <TechnologyBaselinePanel
          runId={runId}
          manifestFinalized={false}
          buyerPolished={false}
          usedStaticDemoRun={false}
          warningCountDisplay={0}
        />
      </SearchParamsRerenderHost>,
    );

    await waitFor(() => {
      expect(screen.queryByTestId("technology-baseline-rationale-dialog")).not.toBeInTheDocument();
    });
  });

  it("does not open the rationale dialog from a prior run ledger while the next run is still loading", async () => {
    const otherRunId = "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee";
    let resolveOtherRun: ((value: { runId: string; entries: unknown[] }) => void) | undefined;

    mockGetTechnologyLedger.mockImplementation(async (requestedRunId: string) => {
      if (requestedRunId === otherRunId) {
        return await new Promise((resolve) => {
          resolveOtherRun = resolve;
        });
      }

      return {
        runId: runId.replace(/-/g, ""),
        entries: [
          {
            entryId: "entry-assumed",
            runId: runId.replace(/-/g, ""),
            role: "PrimaryDatastore",
            technologyName: "Azure SQL Database",
            providerFamily: "Azure",
            status: "Assumed",
            source: "AgentProposed",
            evidenceRef: "agentTopologyProposal:demo:ds-1",
            rationale: "Proposed by the architecture-structure assessment.",
            isLocked: false,
            createdUtc: "2026-01-01T00:00:00.000Z",
            updatedUtc: "2026-01-01T00:00:00.000Z",
          },
        ],
      };
    });

    searchParamsHarness.applyQuery(`reviewTab=overview&${TECHNOLOGY_BASELINE_ENTRY_PARAM}=entry-assumed`);

    const { rerender } = render(
      <SearchParamsRerenderHost>
        <TechnologyBaselinePanel
          runId={runId}
          manifestFinalized={false}
          buyerPolished={false}
          usedStaticDemoRun={false}
          warningCountDisplay={0}
        />
      </SearchParamsRerenderHost>,
    );

    await screen.findByText("Azure SQL Database");

    await waitFor(() => {
      expect(screen.getByTestId("technology-baseline-rationale-dialog")).toBeInTheDocument();
    });

    rerender(
      <SearchParamsRerenderHost>
        <TechnologyBaselinePanel
          runId={otherRunId}
          manifestFinalized={false}
          buyerPolished={false}
          usedStaticDemoRun={false}
          warningCountDisplay={0}
        />
      </SearchParamsRerenderHost>,
    );

    expect(screen.queryByTestId("technology-baseline-rationale-dialog")).not.toBeInTheDocument();

    resolveOtherRun?.({
      runId: otherRunId.replace(/-/g, ""),
      entries: [
        {
          entryId: "entry-other",
          runId: otherRunId.replace(/-/g, ""),
          role: "PrimaryDatastore",
          technologyName: "Other datastore",
          providerFamily: "Azure",
          status: "Assumed",
          source: "AgentProposed",
          evidenceRef: "agentTopologyProposal:demo:ds-2",
          rationale: "Different run.",
          isLocked: false,
          createdUtc: "2026-01-01T00:00:00.000Z",
          updatedUtc: "2026-01-01T00:00:00.000Z",
        },
      ],
    });

    await waitFor(() => {
      expect(screen.getByText("Other datastore")).toBeInTheDocument();
    });

    expect(screen.queryByTestId("technology-baseline-rationale-dialog")).not.toBeInTheDocument();
  });

  it("does not keep evidence ref disclosure open from a prior run while the next run is still loading", async () => {
    const otherRunId = "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee";
    let resolveOtherRun: ((value: { runId: string; entries: unknown[] }) => void) | undefined;

    mockGetTechnologyLedger.mockImplementation(async (requestedRunId: string) => {
      if (requestedRunId === otherRunId) {
        return await new Promise((resolve) => {
          resolveOtherRun = resolve;
        });
      }

      return {
        runId: runId.replace(/-/g, ""),
        entries: [
          {
            entryId: "entry-assumed",
            runId: runId.replace(/-/g, ""),
            role: "PrimaryDatastore",
            technologyName: "Azure SQL Database",
            providerFamily: "Azure",
            status: "Assumed",
            source: "AgentProposed",
            evidenceRef: "agentTopologyProposal:demo:ds-1",
            rationale: "Proposed by the architecture-structure assessment.",
            isLocked: false,
            createdUtc: "2026-01-01T00:00:00.000Z",
            updatedUtc: "2026-01-01T00:00:00.000Z",
          },
        ],
      };
    });

    searchParamsHarness.applyQuery(
      `reviewTab=overview&${TECHNOLOGY_BASELINE_EVIDENCE_REF_ENTRY_ID_PARAM}=entry-assumed`,
    );
    window.history.replaceState(
      {},
      "",
      `/architecture/reviews/${runId}?reviewTab=overview&${TECHNOLOGY_BASELINE_EVIDENCE_REF_ENTRY_ID_PARAM}=entry-assumed`,
    );

    const { rerender } = render(
      <SearchParamsRerenderHost>
        <TechnologyBaselinePanel
          runId={runId}
          manifestFinalized={false}
          buyerPolished={false}
          usedStaticDemoRun={false}
          warningCountDisplay={0}
        />
      </SearchParamsRerenderHost>,
    );

    await screen.findByText("Azure SQL Database");

    const evidenceDetails = () => screen.getByText("Evidence ref").closest("details");

    await waitFor(() => {
      expect(evidenceDetails()).toHaveAttribute("open");
    });

    searchParamsHarness.applyQuery("reviewTab=overview");
    window.history.replaceState({}, "", `/architecture/reviews/${otherRunId}?reviewTab=overview`);

    rerender(
      <SearchParamsRerenderHost>
        <TechnologyBaselinePanel
          runId={otherRunId}
          manifestFinalized={false}
          buyerPolished={false}
          usedStaticDemoRun={false}
          warningCountDisplay={0}
        />
      </SearchParamsRerenderHost>,
    );

    expect(screen.queryByText("Azure SQL Database")).not.toBeInTheDocument();
    expect(screen.queryByText("Evidence ref")).not.toBeInTheDocument();

    resolveOtherRun?.({
      runId: otherRunId.replace(/-/g, ""),
      entries: [
        {
          entryId: "entry-assumed",
          runId: otherRunId.replace(/-/g, ""),
          role: "PrimaryDatastore",
          technologyName: "Other datastore",
          providerFamily: "Azure",
          status: "Assumed",
          source: "AgentProposed",
          evidenceRef: "agentTopologyProposal:demo:ds-2",
          rationale: "Different run.",
          isLocked: false,
          createdUtc: "2026-01-01T00:00:00.000Z",
          updatedUtc: "2026-01-01T00:00:00.000Z",
        },
      ],
    });

    await waitFor(() => {
      expect(screen.getByText("Other datastore")).toBeInTheDocument();
    });

    const otherEvidenceDetails = screen.getByText("Evidence ref").closest("details");
    expect(otherEvidenceDetails).not.toHaveAttribute("open");
  });
});
