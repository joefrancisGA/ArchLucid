import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ReviewDetailWorkspace } from "@/components/reviews/ReviewDetailWorkspace";
import { reviewDetailTabLabel } from "@/lib/review-detail-workspace-tab-groups";

const pushMock = vi.fn();
const replaceMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    replace: replaceMock,
  }),
  usePathname: () => "/reviews/run-abc",
  useSearchParams: () => new URLSearchParams("reviewTab=overview"),
}));

describe("ReviewDetailWorkspace", () => {
  const panels = {
    overview: <div data-testid="panel-overview">Overview content</div>,
    findings: <div>Findings</div>,
    evidence: <div>Evidence</div>,
    policies: <div>Policies</div>,
    decisionsRemediation: <div>Decisions</div>,
    reviewPackage: <div>Package</div>,
    architecture: <div>Architecture</div>,
    activity: <div>Activity</div>,
  };

  it("renders tab list and overview panel by default", () => {
    render(<ReviewDetailWorkspace tabCounts={{ findings: 3, evidence: 2 }} panels={panels} />);

    expect(screen.getByTestId("review-detail-workspace")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Overview/i })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByTestId("panel-overview")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Findings/i })).toHaveTextContent("3");
    expect(screen.getByRole("tab", { name: /Evidence/i })).toHaveTextContent("2");
  });

  it("keeps overflow tabs in a More menu with full labels", () => {
    render(<ReviewDetailWorkspace panels={panels} />);

    expect(screen.getByRole("tab", { name: /Finalize & exports/i })).toBeInTheDocument();
    expect(screen.getByTestId("review-detail-workspace-tab-more-trigger")).toHaveTextContent("More sections");
    expect(screen.queryByRole("tab", { name: /^Architecture$/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("review-detail-workspace-tab-more-trigger"));

    expect(screen.getByTestId("review-detail-workspace-tab-architecture")).toHaveTextContent(
      reviewDetailTabLabel("architecture"),
    );
  });

  it("explains package workflow vs review sections when orientation is enabled", () => {
    render(<ReviewDetailWorkspace panels={panels} showPackageWorkflowOrientation />);

    expect(screen.getByTestId("review-detail-workspace-orientation")).toHaveTextContent("Review workflow");
    expect(screen.getByTestId("review-detail-workspace-orientation")).toHaveTextContent("Review sections");
  });
});
