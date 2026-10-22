import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GovernanceApprovalRationaleGuards } from "./GovernanceApprovalRationaleGuards";

const usePathname = vi.fn();
const useSearchParams = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => usePathname(),
  useSearchParams: () => useSearchParams(),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
}));

describe("GovernanceApprovalRationaleGuards (LW-072)", () => {
  beforeEach(() => {
    usePathname.mockReturnValue("/governance/workflow");
    useSearchParams.mockReturnValue(new URLSearchParams());
  });

  it("does not render a leave dialog when the review comment is empty", () => {
    render(
      <GovernanceApprovalRationaleGuards
        approvalRequestId="approval-req-1"
        enabled={true}
        reviewComment=""
        reviewedBy=""
        setReviewComment={vi.fn()}
        setReviewedBy={vi.fn()}
      />,
    );

    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
