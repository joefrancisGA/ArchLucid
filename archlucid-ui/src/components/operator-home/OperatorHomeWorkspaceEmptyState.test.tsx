import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { OperatorHomeWorkspaceEmptyState } from "@/components/operator-home/OperatorHomeWorkspaceEmptyState";
import {
  OPERATOR_HOME_WORKSPACE_EMPTY_BODY,
  OPERATOR_HOME_WORKSPACE_EMPTY_TITLE,
} from "@/lib/buyer-polish-copy";

describe("OperatorHomeWorkspaceEmptyState (TB-352)", () => {
  it("uses the compact enterprise empty pattern without duplicate sample CTAs", () => {
    render(<OperatorHomeWorkspaceEmptyState />);

    expect(screen.getByTestId("operator-home-workspace-empty-state")).toBeInTheDocument();
    expect(screen.getByText(OPERATOR_HOME_WORKSPACE_EMPTY_TITLE)).toBeInTheDocument();
    expect(screen.getByText(OPERATOR_HOME_WORKSPACE_EMPTY_BODY)).toBeInTheDocument();
    expect(screen.queryByText(/manifest/i)).toBeNull();
    expect(screen.queryByRole("button", { name: /run demo review/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /load sample workspace/i })).toBeNull();
    expect(screen.queryByTestId("seed-sample-review-button")).toBeNull();
  });
});
