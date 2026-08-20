import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  REVIEW_WORKSPACE_ROOT_TEST_ID,
  REVIEW_WORKSPACE_TAB_STRIP_TEST_ID,
  ReviewWorkspaceShell,
} from "@/components/reviews/ReviewWorkspaceShell";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("reviewTab=overview"),
}));

vi.mock("@/components/reviews/ReviewDetailWorkspace", () => ({
  ReviewDetailWorkspace: () => <div data-testid="review-detail-workspace-stub" />,
}));

describe("ReviewWorkspaceShell (TB-2367)", () => {
  it("renders lifecycle metadata and delegates to ReviewDetailWorkspace", () => {
    render(
      <ReviewWorkspaceShell
        lifecycle="finalized"
        runId="run-1"
        panels={{
          overview: null,
          findings: null,
          evidence: null,
          policies: null,
          decisionsRemediation: null,
          reviewPackage: null,
          architecture: null,
          activity: null,
        }}
      />,
    );

    const shell = screen.getByTestId(REVIEW_WORKSPACE_ROOT_TEST_ID);

    expect(shell).toHaveAttribute("data-workspace-lifecycle", "finalized");
    expect(screen.getByTestId("review-detail-workspace-stub")).toBeInTheDocument();
    expect(REVIEW_WORKSPACE_TAB_STRIP_TEST_ID).toBe("review-workspace-tab-strip");
  });
});
