import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TechnologyBaselinePanel } from "@/components/reviews/technology-baseline/TechnologyBaselinePanel";
import type { TechnologyLedgerEntry, TechnologyLedgerListResponse } from "@/types/technology-ledger";

vi.mock("@/lib/api/technology-ledger", () => ({
  getTechnologyLedger: vi.fn(),
  patchTechnologyLedgerEntry: vi.fn(),
}));

import { getTechnologyLedger, patchTechnologyLedgerEntry } from "@/lib/api/technology-ledger";

const mockGetTechnologyLedger = vi.mocked(getTechnologyLedger);
const mockPatchTechnologyLedgerEntry = vi.mocked(patchTechnologyLedgerEntry);

const runId = "dddddddd-dddd-dddd-dddd-dddddddddddd";

function sampleEntry(overrides: Partial<TechnologyLedgerEntry> = {}): TechnologyLedgerEntry {
  return {
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
    ...overrides,
  };
}

function listResponse(entries: TechnologyLedgerEntry[]): TechnologyLedgerListResponse {
  return { runId: runId.replace(/-/g, ""), entries };
}

describe("TechnologyBaselinePanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetTechnologyLedger.mockResolvedValue(listResponse([sampleEntry()]));
  });

  it("renders rows with status badges", async () => {
    render(
      <TechnologyBaselinePanel
        runId={runId}
        manifestFinalized={false}
        buyerPolished={false}
        usedStaticDemoRun={false}
        warningCountDisplay={0}
      />,
    );

    expect(await screen.findByText("Azure SQL Database")).toBeInTheDocument();
    expect(screen.getByText("Assumed")).toBeInTheDocument();
    expect(screen.getByText("Agent proposal")).toBeInTheDocument();
  });

  it("shows pre-finalize banner when Assumed rows exist", async () => {
    render(
      <TechnologyBaselinePanel
        runId={runId}
        manifestFinalized={false}
        buyerPolished={false}
        usedStaticDemoRun={false}
        warningCountDisplay={0}
      />,
    );

    expect(
      await screen.findByText(/Agent-proposed technology choices still need operator approval/i),
    ).toBeInTheDocument();
  });

  it("approve on Assumed row PATCHes Chosen and refreshes", async () => {
    const chosen = sampleEntry({ status: "Chosen", source: "User" });
    mockPatchTechnologyLedgerEntry.mockResolvedValue({ entry: chosen });
    mockGetTechnologyLedger
      .mockResolvedValueOnce(listResponse([sampleEntry()]))
      .mockResolvedValueOnce(listResponse([chosen]));

    render(
      <TechnologyBaselinePanel
        runId={runId}
        manifestFinalized={false}
        buyerPolished={false}
        usedStaticDemoRun={false}
        warningCountDisplay={0}
      />,
    );

    await screen.findByRole("button", { name: "Approve" });
    fireEvent.click(screen.getByRole("button", { name: "Approve" }));

    await waitFor(() => {
      expect(mockPatchTechnologyLedgerEntry).toHaveBeenCalledWith(runId, "entry-assumed", {
        status: "Chosen",
      });
    });

    expect(await screen.findByText("Chosen")).toBeInTheDocument();
  });

  it("lock calls PATCH with isLocked true", async () => {
    const chosen = sampleEntry({ status: "Chosen", source: "User" });
    mockGetTechnologyLedger.mockResolvedValue(listResponse([chosen]));
    mockPatchTechnologyLedgerEntry.mockResolvedValue({ entry: { ...chosen, isLocked: true } });

    render(
      <TechnologyBaselinePanel
        runId={runId}
        manifestFinalized={true}
        buyerPolished={false}
        usedStaticDemoRun={false}
        warningCountDisplay={0}
      />,
    );

    await screen.findByRole("button", { name: "Lock" });
    fireEvent.click(screen.getByRole("button", { name: "Lock" }));

    await waitFor(() => {
      expect(mockPatchTechnologyLedgerEntry).toHaveBeenCalledWith(runId, "entry-assumed", {
        isLocked: true,
      });
    });
  });

  it("shows action error without clearing prior rows after failed PATCH", async () => {
    mockPatchTechnologyLedgerEntry.mockRejectedValue(
      Object.assign(new Error("Locked row cannot change status."), { correlationId: "corr-1" }),
    );

    render(
      <TechnologyBaselinePanel
        runId={runId}
        manifestFinalized={false}
        buyerPolished={false}
        usedStaticDemoRun={false}
        warningCountDisplay={0}
      />,
    );

    await screen.findByRole("button", { name: "Approve" });
    fireEvent.click(screen.getByRole("button", { name: "Approve" }));

    expect(await screen.findByText("Locked row cannot change status.")).toBeInTheDocument();
    expect(screen.getByText("Azure SQL Database")).toBeInTheDocument();
  });

  it("opens rationale dialog and PATCHes trimmed note on submit", async () => {
    const chosen = sampleEntry({ status: "Chosen", source: "User", isLocked: true, rationale: "" });
    mockGetTechnologyLedger.mockResolvedValue(listResponse([chosen]));
    mockPatchTechnologyLedgerEntry.mockResolvedValue({
      entry: { ...chosen, rationale: "Operator-approved datastore choice." },
    });

    render(
      <TechnologyBaselinePanel
        runId={runId}
        manifestFinalized={true}
        buyerPolished={false}
        usedStaticDemoRun={false}
        warningCountDisplay={0}
      />,
    );

    await screen.findByRole("button", { name: "Edit note" });
    fireEvent.click(screen.getByRole("button", { name: "Edit note" }));

    expect(await screen.findByTestId("technology-baseline-rationale-dialog")).toBeInTheDocument();

    const submit = screen.getByTestId("technology-baseline-rationale-submit");
    expect(submit).toBeDisabled();

    fireEvent.change(screen.getByTestId("technology-baseline-rationale-input"), {
      target: { value: "Operator-approved datastore choice." },
    });
    expect(submit).not.toBeDisabled();

    fireEvent.click(submit);

    await waitFor(() => {
      expect(mockPatchTechnologyLedgerEntry).toHaveBeenCalledWith(runId, "entry-assumed", {
        rationale: "Operator-approved datastore choice.",
      });
    });
  });

  it("shows ledger drift warnings when Chosen providers conflict", async () => {
    mockGetTechnologyLedger.mockResolvedValue(
      listResponse([
        sampleEntry({
          entryId: "entry-azure",
          role: "PrimaryDatastore",
          status: "Chosen",
          providerFamily: "Azure",
          source: "User",
        }),
        sampleEntry({
          entryId: "entry-aws",
          role: "PrimaryDatastore",
          status: "Chosen",
          providerFamily: "Aws",
          source: "User",
        }),
      ]),
    );

    render(
      <TechnologyBaselinePanel
        runId={runId}
        manifestFinalized={false}
        buyerPolished={false}
        usedStaticDemoRun={false}
        warningCountDisplay={0}
      />,
    );

    expect(await screen.findByTestId("technology-baseline-drift-warnings")).toBeInTheDocument();
    expect(screen.getByText(/multiple Chosen rows with different providers/i)).toBeInTheDocument();
  });

  it("does not use window.prompt for rationale capture", async () => {
    const chosen = sampleEntry({ status: "Chosen", source: "User", isLocked: true, rationale: "" });
    mockGetTechnologyLedger.mockResolvedValue(listResponse([chosen]));
    const promptSpy = vi.spyOn(window, "prompt");

    render(
      <TechnologyBaselinePanel
        runId={runId}
        manifestFinalized={true}
        buyerPolished={false}
        usedStaticDemoRun={false}
        warningCountDisplay={0}
      />,
    );

    await screen.findByRole("button", { name: "Edit note" });
    fireEvent.click(screen.getByRole("button", { name: "Edit note" }));

    expect(promptSpy).not.toHaveBeenCalled();
    expect(await screen.findByTestId("technology-baseline-rationale-dialog")).toBeInTheDocument();

    promptSpy.mockRestore();
  });
});
