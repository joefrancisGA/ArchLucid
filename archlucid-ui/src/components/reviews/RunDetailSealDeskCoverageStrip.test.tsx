import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const workspaceModeMock = vi.hoisted(() => ({
  isWorkingMode: true,
}));

vi.mock("@/components/WorkspaceModeProvider", () => ({
  useWorkspaceMode: () => workspaceModeMock,
}));

import { RunDetailSealDeskCoverageStrip } from "./RunDetailSealDeskCoverageStrip";

describe("RunDetailSealDeskCoverageStrip", () => {
  it("shows quiet-engine copy when analysis is complete and graph has no actors", () => {
    workspaceModeMock.isWorkingMode = true;

    render(
      <RunDetailSealDeskCoverageStrip
        runId="run-abc"
        analysisStagesComplete
        graphSnapshot={{ nodes: [{ nodeType: "service" }] }}
      />,
    );

    expect(screen.getByTestId("run-detail-seal-desk-coverage-strip")).toBeInTheDocument();
    expect(screen.getByTestId("run-detail-seal-desk-quiet-engines-line")).toHaveTextContent("Trust-boundary");
    expect(screen.getByRole("link", { name: /Add people and systems on Architecture/i })).toHaveAttribute(
      "href",
      "/architecture/reviews/run-abc?reviewTab=architecture",
    );
  });

  it("shows skipped MUST question keys from the transparency trail", () => {
    workspaceModeMock.isWorkingMode = true;

    render(
      <RunDetailSealDeskCoverageStrip
        runId="run-abc"
        analysisStagesComplete
        graphSnapshot={{ nodes: [{ nodeType: "Actor" }] }}
        transparencyTrail={{
          skipped: [{ questionKey: "data-residency", tier: "Must" }],
          answered: [],
        }}
      />,
    );

    expect(screen.getByTestId("run-detail-seal-desk-skipped-must-line")).toHaveTextContent("data-residency");
    expect(screen.queryByTestId("run-detail-seal-desk-quiet-engines-line")).not.toBeInTheDocument();
  });

  it("renders nothing in Guided mode", () => {
    workspaceModeMock.isWorkingMode = false;

    const { container } = render(
      <RunDetailSealDeskCoverageStrip runId="run-abc" analysisStagesComplete graphSnapshot={{ nodes: [] }} />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
