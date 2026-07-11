import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

import { CREATE_ARCHITECTURE_LABEL } from "@/lib/architecture-workflow-labels";
import { OperatorHomeWorkspaceEmptyState } from "@/components/operator-home/OperatorHomeWorkspaceEmptyState";
import {
  OPERATOR_HOME_OPEN_FULL_EXAMPLE_REVIEW_CTA,
  OPERATOR_HOME_WORKSPACE_EMPTY_BODY,
  OPERATOR_HOME_WORKSPACE_EMPTY_TITLE,
} from "@/lib/buyer-polish-copy";

describe("OperatorHomeWorkspaceEmptyState (TB-352)", () => {
  it("uses the compact enterprise empty pattern with create-and-review actions", () => {
    render(<OperatorHomeWorkspaceEmptyState />);

    expect(screen.getByTestId("operator-home-workspace-empty-state")).toBeInTheDocument();
    expect(screen.getByText(OPERATOR_HOME_WORKSPACE_EMPTY_TITLE)).toBeInTheDocument();
    expect(screen.getByText(OPERATOR_HOME_WORKSPACE_EMPTY_BODY)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: CREATE_ARCHITECTURE_LABEL })).toHaveAttribute("href", "/reviews/new");
    expect(screen.getByRole("link", { name: OPERATOR_HOME_OPEN_FULL_EXAMPLE_REVIEW_CTA })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: CREATE_ARCHITECTURE_LABEL })).toHaveLength(1);
    expect(screen.queryByText(/manifest/i)).toBeNull();
    expect(screen.queryByRole("button", { name: /run demo review/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /load sample workspace/i })).toBeNull();
    expect(screen.queryByTestId("seed-sample-review-button")).toBeNull();
  });
});
