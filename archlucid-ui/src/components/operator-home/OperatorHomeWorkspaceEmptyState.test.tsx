import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

import { OperatorHomeWorkspaceEmptyState } from "@/components/operator-home/OperatorHomeWorkspaceEmptyState";
import {
  OPERATOR_HOME_LEARN_HOW_REVIEWS_WORK_CTA,
  OPERATOR_HOME_WORKSPACE_EMPTY_TITLE,
} from "@/lib/buyer/buyer-polish-copy";

describe("OperatorHomeWorkspaceEmptyState (TB-352 / TB-1038)", () => {
  it("uses the compact empty pattern without duplicating hero actions", () => {
    render(<OperatorHomeWorkspaceEmptyState />);

    expect(screen.getByTestId("operator-home-workspace-empty-state")).toBeInTheDocument();
    expect(screen.getByText(OPERATOR_HOME_WORKSPACE_EMPTY_TITLE)).toBeInTheDocument();
    expect(screen.getByText(/Your in-progress and completed architecture reviews will appear here/i)).toBeInTheDocument();
    expect(screen.getByTestId("inline-glossary-chip-signed-review-record")).toBeInTheDocument();
    expect(screen.getByTestId("inline-glossary-chip-evidence-trail")).toBeInTheDocument();
    // Learn how / workflow live on the hero Do-this-next card (TB-1038).
    expect(screen.queryByRole("link", { name: OPERATOR_HOME_LEARN_HOW_REVIEWS_WORK_CTA })).toBeNull();
    expect(screen.queryByRole("link", { name: /create architecture/i })).toBeNull();
    expect(screen.queryByRole("link", { name: /open completed review/i })).toBeNull();
    expect(screen.queryByText(/manifest/i)).toBeNull();
    expect(screen.queryByRole("button", { name: /run demo review/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /load sample workspace/i })).toBeNull();
    expect(screen.queryByTestId("seed-sample-review-button")).toBeNull();
  });
});
