import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { FinalizeSkippedMustStrip } from "./FinalizeSkippedMustStrip";

const workspaceModeMock = vi.hoisted(() => ({ isWorkingMode: true }));

vi.mock("@/components/WorkspaceModeProvider", () => ({
  useWorkspaceMode: () => ({
    isWorkingMode: workspaceModeMock.isWorkingMode,
  }),
}));

describe("FinalizeSkippedMustStrip", () => {
  it("shows skipped MUST questions in Working mode", () => {
    workspaceModeMock.isWorkingMode = true;

    render(
      <FinalizeSkippedMustStrip
        transparencyTrail={{
          asserted: [],
          inferred: [],
          skipped: [{ questionKey: "l0.pillar.security", tier: "Must" }],
        }}
      />,
    );

    expect(screen.getByTestId("finalize-skipped-must-strip")).toBeInTheDocument();
    expect(screen.getByText(/security-baseline/i)).toBeInTheDocument();
  });

  it("stays hidden in Guided mode", () => {
    workspaceModeMock.isWorkingMode = false;

    render(
      <FinalizeSkippedMustStrip
        transparencyTrail={{
          asserted: [],
          inferred: [],
          skipped: [{ questionKey: "l0.pillar.security", tier: "Must" }],
        }}
      />,
    );

    expect(screen.queryByTestId("finalize-skipped-must-strip")).not.toBeInTheDocument();
  });
});
