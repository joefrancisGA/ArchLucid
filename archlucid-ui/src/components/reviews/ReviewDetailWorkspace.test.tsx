import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ReviewDetailWorkspace } from "@/components/reviews/ReviewDetailWorkspace";

const pushMock = vi.fn();
const replaceMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    replace: replaceMock,
  }),
  usePathname: () => "/architecture/reviews/run-abc",
  useSearchParams: () => new URLSearchParams("reviewTab=overview"),
}));

const workspacePanels = {
  overview: <div data-testid="panel-overview">Overview content</div>,
  findings: <div data-testid="panel-findings">Findings</div>,
  evidence: <div>Evidence</div>,
  policies: <div>Policies</div>,
  decisionsRemediation: <div>Decisions</div>,
  reviewPackage: <div>Package</div>,
  architecture: <div>Architecture</div>,
  activity: <div>Activity</div>,
};

describe("ReviewDetailWorkspace", () => {
  it("renders tab list and overview panel by default", () => {
    render(
      <ReviewDetailWorkspace
        tabCounts={{ findings: 3, evidence: 2 }}
        panels={workspacePanels}
      />,
    );

    expect(screen.getByTestId("review-detail-workspace")).toBeInTheDocument();
    expect(screen.getByTestId("review-detail-workspace-tabs").className).toContain("overflow-y-hidden");
    expect(screen.getByRole("tab", { name: /Overview/i })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByTestId("panel-overview")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Findings/i })).toHaveTextContent("3");
    expect(screen.getByRole("tab", { name: /Evidence/i })).toHaveTextContent("2");
  });

  it("switches tabs via replaceState without triggering Next.js router navigation", () => {
    const replaceStateSpy = vi.spyOn(window.history, "replaceState");

    window.history.replaceState({}, "", "/architecture/reviews/run-abc?reviewTab=overview");

    render(<ReviewDetailWorkspace tabCounts={{ findings: 3 }} panels={workspacePanels} />);

    fireEvent.click(screen.getByRole("tab", { name: /Findings/i }));

    expect(pushMock).not.toHaveBeenCalled();
    expect(replaceMock).not.toHaveBeenCalled();
    expect(replaceStateSpy).toHaveBeenCalled();
    expect(screen.getByRole("tab", { name: /Findings/i })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByTestId("panel-findings")).toBeInTheDocument();
  });
});
