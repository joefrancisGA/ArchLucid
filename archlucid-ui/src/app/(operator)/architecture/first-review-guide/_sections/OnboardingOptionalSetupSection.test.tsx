import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  FIRST_REVIEW_GUIDE_OPTIONAL_SETUP_TITLE,
  ONBOARDING_OPTIONAL_SETUP_COLLAPSED_SUMMARY,
  ONBOARDING_WORKSPACE_SETUP_ADMIN_DELEGATION,
} from "@/lib/buyer/buyer-polish-copy";
import { ONBOARDING_OPTIONAL_SETUP_HEADING_ID } from "@/lib/first-review-guide-route";

import { OnboardingOptionalSetupSection } from "./OnboardingOptionalSetupSection";

const useFinishSetupReadinessContext = vi.fn();

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => <a href={href}>{children}</a>,
}));

vi.mock("@/hooks/use-finish-setup-readiness-context", () => ({
  useFinishSetupReadinessContext: () => useFinishSetupReadinessContext(),
}));

vi.mock("./OptionalWorkspaceSetupList", () => ({
  OptionalWorkspaceSetupList: () => <div data-testid="optional-workspace-setup-list-stub" />,
  OptionalWorkspaceSetupDismissButton: ({ onDismiss }: { onDismiss: () => void }) => (
    <button type="button" data-testid="optional-workspace-setup-dismiss" onClick={onDismiss}>
      Dismiss optional setup
    </button>
  ),
}));

vi.mock("@/components/operator-home/OperatorHomeDisclosureSection", () => ({
  OperatorHomeDisclosureSection: ({
    title,
    children,
    sectionTestId,
    collapsedSummary,
  }: {
    title: string;
    children: ReactNode;
    sectionTestId?: string;
    collapsedSummary?: string;
  }) => (
    <section data-testid={sectionTestId ?? title}>
      <h2>{title}</h2>
      {collapsedSummary ? <p data-testid="optional-setup-collapsed-summary">{collapsedSummary}</p> : null}
      {children}
    </section>
  ),
}));

describe("OnboardingOptionalSetupSection", () => {
  beforeEach(() => {
    window.localStorage.clear();
    useFinishSetupReadinessContext.mockReturnValue({
      phase: "ready",
      context: {
        healthReady: true,
        healthLoadFailed: false,
        principalAdmin: true,
      },
      readyCount: 2,
      totalCount: 3,
    });
  });

  it("groups optional workspace setup rows under a collapsed disclosure for workspace admins", () => {
    render(<OnboardingOptionalSetupSection />);

    expect(screen.getByTestId("onboarding-optional-setup")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: FIRST_REVIEW_GUIDE_OPTIONAL_SETUP_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("optional-setup-collapsed-summary")).toHaveTextContent(
      ONBOARDING_OPTIONAL_SETUP_COLLAPSED_SUMMARY,
    );
    expect(screen.getByTestId("optional-workspace-setup-list-stub")).toBeInTheDocument();
    expect(screen.queryByTestId("onboarding-optional-setup-delegation")).not.toBeInTheDocument();
  });

  it("shows admin-delegation copy instead of setup rows for non-admin principals", () => {
    useFinishSetupReadinessContext.mockReturnValue({
      phase: "ready",
      context: {
        healthReady: true,
        healthLoadFailed: false,
        principalAdmin: false,
      },
      readyCount: 1,
      totalCount: 3,
    });

    render(<OnboardingOptionalSetupSection />);

    expect(screen.getByTestId("onboarding-optional-setup-delegation")).toBeInTheDocument();
    expect(screen.getByTestId("onboarding-optional-setup-delegation")).toHaveAttribute(
      "id",
      ONBOARDING_OPTIONAL_SETUP_HEADING_ID,
    );
    expect(screen.getByText(ONBOARDING_WORKSPACE_SETUP_ADMIN_DELEGATION)).toBeInTheDocument();
    expect(screen.queryByTestId("onboarding-optional-setup")).not.toBeInTheDocument();
    expect(screen.queryByTestId("optional-workspace-setup-list-stub")).not.toBeInTheDocument();
  });
});
