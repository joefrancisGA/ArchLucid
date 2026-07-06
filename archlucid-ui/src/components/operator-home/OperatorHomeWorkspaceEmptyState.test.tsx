import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();
  return {
    ...actual,
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
  redirect: vi.fn(),
    permanentRedirect: vi.fn(),
    notFound: vi.fn(),
  };
});

import { OperatorHomeWorkspaceEmptyState } from "@/components/operator-home/OperatorHomeWorkspaceEmptyState";
import {
  OPERATOR_HOME_WORKSPACE_EMPTY_BODY,
  OPERATOR_HOME_WORKSPACE_EMPTY_TITLE,
} from "@/lib/buyer-polish-copy";
import { OPERATOR_HOME_REVIEWS_EMPTY_COMPACT } from "@/lib/enterprise-compact-empty-state-presets";

describe("OperatorHomeWorkspaceEmptyState (TB-352)", () => {
  it("uses the compact enterprise empty pattern with demo seed CTA", () => {
    render(<OperatorHomeWorkspaceEmptyState />);

    expect(screen.getByTestId("operator-home-workspace-empty-state")).toBeInTheDocument();
    expect(screen.getByText(OPERATOR_HOME_WORKSPACE_EMPTY_TITLE)).toBeInTheDocument();
    expect(screen.getByTestId("seed-sample-review-button")).toBeInTheDocument();
    expect(screen.getByText(OPERATOR_HOME_REVIEWS_EMPTY_COMPACT.description!)).toBeInTheDocument();
    expect(screen.getByText(OPERATOR_HOME_WORKSPACE_EMPTY_BODY)).toBeInTheDocument();
    expect(screen.queryByText(/manifest/i)).toBeNull();

    const runDemoButton = screen.getByRole("button", { name: /run demo review/i });
    const loadSampleButton = screen.getByRole("button", { name: /load sample workspace/i });

    expect(runDemoButton).toBeInTheDocument();
    expect(loadSampleButton).toBeInTheDocument();
    expect(runDemoButton.querySelector("svg")).toBeNull();
    expect(loadSampleButton.querySelector("svg")).toBeNull();
    expect(runDemoButton.className).toContain("al-primary-action-bg");
    expect(loadSampleButton.className).toContain("border-neutral-300");
    expect(loadSampleButton.className).not.toContain("al-primary-action-bg");
  });
});
