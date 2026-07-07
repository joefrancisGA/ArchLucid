import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ONBOARDING_WORKSPACE_SETUP_ADMIN_DELEGATION } from "@/lib/buyer-polish-copy";

import { OnboardingOptionalSetupSection } from "./OnboardingOptionalSetupSection";

const useFinishSetupReadinessContext = vi.fn();

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => <a href={href}>{children}</a>,
}));

vi.mock("@/hooks/use-finish-setup-readiness-context", () => ({
  useFinishSetupReadinessContext: () => useFinishSetupReadinessContext(),
}));

vi.mock("@/components/FinishSetupWizardPanel", () => ({
  FinishSetupWizardPanel: ({ variant }: { variant?: string }) => (
    <div data-testid="finish-setup-wizard-panel-stub" data-variant={variant ?? "default"} />
  ),
}));

vi.mock("@/components/operator-home/OperatorHomeDisclosureSection", () => ({
  OperatorHomeDisclosureSection: ({
    title,
    children,
    sectionTestId,
  }: {
    title: string;
    children: ReactNode;
    sectionTestId?: string;
  }) => (
    <section data-testid={sectionTestId ?? title}>
      <h2>{title}</h2>
      {children}
    </section>
  ),
}));

describe("OnboardingOptionalSetupSection", () => {
  beforeEach(() => {
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

  it("groups ROI baseline and workspace setup under optional setup for workspace admins", () => {
    render(<OnboardingOptionalSetupSection />);

    expect(screen.getByTestId("onboarding-optional-setup")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Configure ROI baseline" })).toHaveAttribute("href", "/settings/baseline");
    expect(screen.getByTestId("finish-setup-wizard-panel-stub")).toHaveAttribute("data-variant", "optional");
    expect(screen.queryByTestId("onboarding-optional-setup-delegation")).not.toBeInTheDocument();
  });

  it("shows admin-delegation copy instead of SSO and workspace setup for non-admin principals", () => {
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
    expect(screen.getByText(ONBOARDING_WORKSPACE_SETUP_ADMIN_DELEGATION)).toBeInTheDocument();
    expect(screen.queryByTestId("onboarding-optional-setup")).not.toBeInTheDocument();
    expect(screen.queryByTestId("finish-setup-wizard-panel-stub")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Configure ROI baseline" })).not.toBeInTheDocument();
  });
});
