import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { QuickDecisionFinding } from "@/lib/quick-decision-finding-from-detail";
import { RunDetailPreFinalizeGateHonestyStrip } from "./RunDetailPreFinalizeGateHonestyStrip";

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

function sampleFinding(
  overrides: Partial<QuickDecisionFinding> = {},
): QuickDecisionFinding {
  return {
    findingId: "finding-1",
    title: "Public database ingress",
    severity: "Error",
    classification: "DecisionGradeFinding",
    semanticSupportBand: "Unchecked",
    ...overrides,
  };
}

describe("RunDetailPreFinalizeGateHonestyStrip (DR-04 / AS-064 / AS-065)", () => {
  beforeEach(() => {
    effectiveDoorMock.value = "career";
  });

  it("shows rehearsal door honesty when Ready labels are suppressed (AS-079)", () => {
    effectiveDoorMock.value = "rehearsal";
    healthReadyMock.mockReturnValue({
      data: { preCommitGateEnabled: true, status: "Healthy", entries: [] },
    });

    render(<RunDetailPreFinalizeGateHonestyStrip manifestFinalized={false} />);

    expect(screen.getByTestId("run-detail-pre-finalize-rehearsal-door-honesty-strip")).toBeInTheDocument();
    expect(screen.getByText("Rehearsal door — not ready to finalize")).toBeInTheDocument();
  });

  it("shows the persistent banner when the host gate is disabled", () => {
    healthReadyMock.mockReturnValue({
      data: { preCommitGateEnabled: false, status: "Healthy", entries: [] },
    });

    render(<RunDetailPreFinalizeGateHonestyStrip />);

    expect(screen.getByTestId("run-detail-pre-finalize-gate-honesty-strip")).toBeInTheDocument();
    expect(screen.getByText("Finalize will not be blocked by policy")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Serious findings can still be sealed here. This is not a fully governed review record.",
      ),
    ).toBeInTheDocument();
  });

  it("hides when the gate is enabled and no unchecked semantic support rows exist", () => {
    healthReadyMock.mockReturnValue({
      data: { preCommitGateEnabled: true, status: "Healthy", entries: [] },
    });

    const { container } = render(
      <RunDetailPreFinalizeGateHonestyStrip
        findings={[sampleFinding({ semanticSupportBand: "Supported" })]}
        manifestFinalized={false}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("shows unchecked semantic support warning before finalize without blocking copy", () => {
    healthReadyMock.mockReturnValue({
      data: { preCommitGateEnabled: true, status: "Healthy", entries: [] },
    });

    render(
      <RunDetailPreFinalizeGateHonestyStrip
        findings={[sampleFinding()]}
        manifestFinalized={false}
      />,
    );

    expect(screen.getByTestId("run-detail-pre-finalize-unchecked-semantic-support-strip")).toBeInTheDocument();
    expect(screen.getByText("Semantic support is not confirmed for some findings")).toBeInTheDocument();
    expect(screen.getByText(/Structural citations are present/i)).toBeInTheDocument();
    expect(screen.getByText(/Finalize stays enabled/i)).toBeInTheDocument();
    expect(screen.queryByText(/blocked/i)).toBeNull();
  });

  it("hides unchecked semantic support warning after finalize", () => {
    healthReadyMock.mockReturnValue({
      data: { preCommitGateEnabled: true, status: "Healthy", entries: [] },
    });

    const { container } = render(
      <RunDetailPreFinalizeGateHonestyStrip
        findings={[sampleFinding()]}
        manifestFinalized={true}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("shows hold-off honesty when unsupported rows exist and the host hold flag is off", () => {
    healthReadyMock.mockReturnValue({
      data: {
        preCommitGateEnabled: true,
        status: "Healthy",
        entries: [],
        pilotStrictHoldOnUnsupportedSemanticSupport: false,
      },
    });

    render(
      <RunDetailPreFinalizeGateHonestyStrip
        findings={[sampleFinding({ semanticSupportBand: "Unsupported" })]}
        manifestFinalized={false}
      />,
    );

    expect(screen.getByTestId("run-detail-pre-finalize-unsupported-hold-off-honesty-strip")).toBeInTheDocument();
    expect(screen.getByText(/TB-1228 keeps semantic support on a warn-only lane/i)).toBeInTheDocument();
    expect(screen.getByText(/finalize stays enabled/i)).toBeInTheDocument();
  });

  it("shows blocking strip when hold flag is on for Working Real PilotStrict", () => {
    healthReadyMock.mockReturnValue({
      data: {
        preCommitGateEnabled: true,
        status: "Healthy",
        entries: [],
        agentOutputQualityGateMode: "PilotStrict",
        pilotStrictHoldOnUnsupportedSemanticSupport: true,
      },
    });

    render(
      <RunDetailPreFinalizeGateHonestyStrip
        findings={[sampleFinding({ semanticSupportBand: "Unsupported" })]}
        manifestFinalized={false}
        structuralExecutionMode="Real"
      />,
    );

    expect(
      screen.getByTestId("run-detail-pre-finalize-unsupported-semantic-support-hold-strip"),
    ).toBeInTheDocument();
    expect(screen.getByText("Finalize is held on Unsupported semantic support")).toBeInTheDocument();
    expect(screen.getByText(/PilotStrict hold on Unsupported is enabled/i)).toBeInTheDocument();
  });
});
