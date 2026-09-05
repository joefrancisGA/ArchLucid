import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RunDetailOverviewTransparencyTrail } from "./RunDetailOverviewTransparencyTrail";

const workspaceModeMock = vi.hoisted(() => ({ isWorkingMode: true }));
const navigationMock = vi.hoisted(() => ({
  pathname: "/architecture/reviews/r1",
  replace: vi.fn(),
  search: "",
}));

vi.mock("@/components/WorkspaceModeProvider", () => ({
  useWorkspaceMode: () => ({
    isWorkingMode: workspaceModeMock.isWorkingMode,
  }),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navigationMock.pathname,
  useRouter: () => ({ replace: navigationMock.replace }),
  useSearchParams: () => new URLSearchParams(navigationMock.search),
}));

describe("RunDetailOverviewTransparencyTrail", () => {
  it("keeps the trail expanded in Working mode", () => {
    workspaceModeMock.isWorkingMode = true;

    render(
      <RunDetailOverviewTransparencyTrail
        feasibilityVerdict={{
          kind: "SoftInfeasible",
          summary: "Not feasible as specified.",
          transparencyTrail: {
            asserted: [{ key: "businessOutcome", value: "Reduce triage time" }],
            inferred: [],
            skipped: [],
          },
        }}
        runCompleted={false}
      />,
    );

    expect(screen.getByTestId("transparency-trail-panel")).toBeInTheDocument();
    expect(screen.getByText(/asserted \(1\)/i)).toBeVisible();
    expect(screen.queryByRole("group")).not.toBeInTheDocument();
  });

  it("collapses the trail behind a disclosure in Guided mode", () => {
    workspaceModeMock.isWorkingMode = false;

    render(
      <RunDetailOverviewTransparencyTrail
        feasibilityVerdict={{
          kind: "SoftInfeasible",
          summary: "Not feasible as specified.",
          transparencyTrail: {
            asserted: [{ key: "businessOutcome", value: "Reduce triage time" }],
            inferred: [],
            skipped: [],
          },
        }}
        runCompleted={false}
      />,
    );

    const panel = screen.getByTestId("transparency-trail-panel");

    expect(panel.tagName).toBe("DETAILS");
    expect(panel).not.toHaveAttribute("open");
  });

  it("shows the missing-trail defect on completed reviews", () => {
    render(
      <RunDetailOverviewTransparencyTrail
        feasibilityVerdict={{ kind: "Feasible", summary: "Ready to proceed." }}
        runCompleted
      />,
    );

    expect(screen.getByTestId("transparency-trail-missing-defect")).toBeInTheDocument();
  });
});
