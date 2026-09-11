import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PreFinalizeChecklistPanel } from "./PreFinalizeChecklistPanel";

const effectiveDoorMock = vi.hoisted(() => ({ value: "career" as "career" | "rehearsal" }));

vi.mock("@/components/WorkspaceModeProvider", () => ({
  useWorkspaceMode: () => ({ isWorkingMode: true }),
}));

vi.mock("@/hooks/use-effective-working-career-rehearsal-door", () => ({
  useEffectiveWorkingCareerRehearsalDoor: () => ({
    door: effectiveDoorMock.value,
    effectiveDoor: effectiveDoorMock.value,
    mounted: true,
  }),
}));

const healthReadyMock = vi.fn();

vi.mock("@/hooks/use-health-ready-summary-query", () => ({
  useHealthReadySummaryQuery: () => healthReadyMock(),
}));

vi.mock("@/lib/api/pre-finalize-checklist", () => ({
  getPreFinalizeChecklist: vi.fn(),
}));

import { getPreFinalizeChecklist } from "@/lib/api/pre-finalize-checklist";

describe("PreFinalizeChecklistPanel", () => {
  beforeEach(() => {
    effectiveDoorMock.value = "career";
    healthReadyMock.mockReturnValue({
      data: { preCommitGateEnabled: true, status: "Healthy", entries: [] },
    });
  });

  it("renders nothing when the manifest is already finalized", () => {
    const { container } = render(
      <PreFinalizeChecklistPanel runId="run-1" manifestFinalized />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("suppresses Ready to finalize label on Working Career + Simulator (CG-030)", async () => {
    vi.mocked(getPreFinalizeChecklist).mockResolvedValue({
      runId: "run-1",
      readyToFinalize: true,
      advisoryCount: 0,
      blockingCount: 0,
      items: [],
    });

    render(
      <PreFinalizeChecklistPanel
        runId="run-1"
        manifestFinalized={false}
        structuralExecutionMode="Simulator"
      />,
    );

    expect(await screen.findByText("Review before finalize")).toBeInTheDocument();
    expect(screen.queryByText("Ready to finalize")).not.toBeInTheDocument();
  });

  it("suppresses Ready to finalize label when pre-commit gate is disabled (CG-030 / LP-18)", async () => {
    healthReadyMock.mockReturnValue({
      data: { preCommitGateEnabled: false, status: "Healthy", entries: [] },
    });
    vi.mocked(getPreFinalizeChecklist).mockResolvedValue({
      runId: "run-1",
      readyToFinalize: true,
      advisoryCount: 0,
      blockingCount: 0,
      items: [],
    });

    render(<PreFinalizeChecklistPanel runId="run-1" manifestFinalized={false} />);

    expect(await screen.findByText("Review before finalize")).toBeInTheDocument();
    expect(screen.queryByText("Ready to finalize")).not.toBeInTheDocument();
  });

  it("suppresses Ready to finalize label on Working Rehearsal door (AS-079)", async () => {
    effectiveDoorMock.value = "rehearsal";
    vi.mocked(getPreFinalizeChecklist).mockResolvedValue({
      runId: "run-1",
      readyToFinalize: true,
      advisoryCount: 0,
      blockingCount: 0,
      items: [],
    });

    render(<PreFinalizeChecklistPanel runId="run-1" manifestFinalized={false} />);

    expect(await screen.findByText("Review before finalize")).toBeInTheDocument();
    expect(screen.queryByText("Ready to finalize")).not.toBeInTheDocument();
  });

  it("shows checklist rows when pre-finalize checks return data", async () => {
    vi.mocked(getPreFinalizeChecklist).mockResolvedValue({
      runId: "run-1",
      readyToFinalize: false,
      advisoryCount: 1,
      blockingCount: 1,
      items: [
        {
          itemId: "technology-baseline-assumed",
          title: "Technology baseline confirmed",
          detail: "1 technology row still marked Assumed.",
          status: "Blocking",
          count: 1,
        },
        {
          itemId: "evidence-linkage-gaps",
          title: "Finding evidence linkage",
          detail: "1 high-severity finding lacks evidence linkage anchors.",
          status: "Advisory",
          count: 1,
        },
      ],
    });

    render(<PreFinalizeChecklistPanel runId="run-1" manifestFinalized={false} />);

    expect(await screen.findByTestId("pre-finalize-checklist-items")).toBeInTheDocument();
    expect(screen.getByText("Review before finalize")).toBeInTheDocument();
    expect(screen.getByText("Technology baseline confirmed")).toBeInTheDocument();
    expect(screen.getByText("Finding evidence linkage")).toBeInTheDocument();
  });
});
