import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ReviewDetailWorkspace } from "@/components/reviews/ReviewDetailWorkspace";

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
  it("renders tab list and overview panel by default", () => {
    render(
      <ReviewDetailWorkspace
        tabCounts={{ findings: 3, evidence: 2 }}
        panels={{
          overview: <div data-testid="panel-overview">Overview content</div>,
          findings: <div>Findings</div>,
          evidence: <div>Evidence</div>,
          policies: <div>Policies</div>,
          decisionsRemediation: <div>Decisions</div>,
          reviewPackage: <div>Package</div>,
          architecture: <div>Architecture</div>,
          activity: <div>Activity</div>,
        }}
      />,
    );

    expect(screen.getByTestId("review-detail-workspace")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Overview/i })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByTestId("panel-overview")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Findings/i })).toHaveTextContent("3");
    expect(screen.getByRole("tab", { name: /Evidence/i })).toHaveTextContent("2");
  });
});
