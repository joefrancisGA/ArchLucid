import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

import { OperatorHomeWorkspaceEmptyState } from "@/components/operator-home/OperatorHomeWorkspaceEmptyState";
import {
  OPERATOR_HOME_LEARN_HOW_REVIEWS_WORK_CTA,
  OPERATOR_HOME_WORKSPACE_EMPTY_BODY,
  OPERATOR_HOME_WORKSPACE_EMPTY_TITLE,
} from "@/lib/buyer-polish-copy";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

describe("OperatorHomeWorkspaceEmptyState (TB-352)", () => {
  it("uses the compact empty pattern without duplicating hero actions", () => {
    render(<OperatorHomeWorkspaceEmptyState />);

    expect(screen.getByTestId("operator-home-workspace-empty-state")).toBeInTheDocument();
    expect(screen.getByText(OPERATOR_HOME_WORKSPACE_EMPTY_TITLE)).toBeInTheDocument();
    expect(screen.getByText(OPERATOR_HOME_WORKSPACE_EMPTY_BODY)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: OPERATOR_HOME_LEARN_HOW_REVIEWS_WORK_CTA })).toHaveAttribute(
      "href",
      inAppHelpHref("first-review"),
    );
    expect(screen.queryByRole("link", { name: /create architecture/i })).toBeNull();
    expect(screen.queryByRole("link", { name: /open completed review/i })).toBeNull();
    expect(screen.queryByText(/manifest/i)).toBeNull();
    expect(screen.queryByRole("button", { name: /run demo review/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /load sample workspace/i })).toBeNull();
    expect(screen.queryByTestId("seed-sample-review-button")).toBeNull();
  });
});
