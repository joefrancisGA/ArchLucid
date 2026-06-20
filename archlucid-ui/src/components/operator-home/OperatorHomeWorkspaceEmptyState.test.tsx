import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

import { OperatorHomeWorkspaceEmptyState } from "@/components/operator-home/OperatorHomeWorkspaceEmptyState";
import {
  BUYER_SCOPE_SAMPLE_WORKSPACE_COMPACT_LABEL,
  OPERATOR_HOME_WORKSPACE_EMPTY_TITLE,
} from "@/lib/buyer-polish-copy";
import { OPERATOR_HOME_REVIEWS_EMPTY_COMPACT } from "@/lib/enterprise-compact-empty-state-presets";

describe("OperatorHomeWorkspaceEmptyState (TB-352)", () => {
  it("uses the compact enterprise empty pattern with demo seed CTA", () => {
    render(<OperatorHomeWorkspaceEmptyState />);

    expect(screen.getByTestId("operator-home-workspace-empty-state")).toBeInTheDocument();
    expect(screen.getByText(OPERATOR_HOME_WORKSPACE_EMPTY_TITLE)).toBeInTheDocument();
    expect(screen.getByTestId("seed-sample-review-button")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Load sample workspace" })).toBeInTheDocument();
    expect(screen.getByText(OPERATOR_HOME_REVIEWS_EMPTY_COMPACT.description!)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(BUYER_SCOPE_SAMPLE_WORKSPACE_COMPACT_LABEL, "i"))).toBeInTheDocument();
    expect(screen.queryByText(/manifest/i)).toBeNull();
  });
});
