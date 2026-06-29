import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { OnboardingOptionalSetupSection } from "./OnboardingOptionalSetupSection";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => <a href={href}>{children}</a>,
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
  it("groups ROI baseline and workspace setup under optional setup without CLI tools", () => {
    render(<OnboardingOptionalSetupSection />);

    expect(screen.getByTestId("onboarding-optional-setup")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Configure ROI baseline" })).toHaveAttribute("href", "/settings/baseline");
    expect(screen.getByTestId("finish-setup-wizard-panel-stub")).toHaveAttribute("data-variant", "optional");
    expect(screen.queryByTestId("onboarding-cli-tools")).not.toBeInTheDocument();
    expect(screen.queryByText(/Developer \/ CLI tools/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Terminal workflow/i)).not.toBeInTheDocument();
  });
});
