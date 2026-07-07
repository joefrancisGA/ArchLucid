import { CREATE_ARCHITECTURE_LABEL } from "@/lib/architecture-workflow-labels";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { OnboardingPageView } from "./OnboardingPageView";
import { BUYER_ONBOARDING_PAGE_LEAD, BUYER_ONBOARDING_PAGE_TITLE, BUYER_ONBOARDING_WALKTHROUGH_HELP_LINK } from "@/lib/buyer-polish-copy";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/OperatorPageContainer", () => ({
  OperatorPageContainer: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/GettingStartedTrialSection", () => ({
  GettingStartedTrialSection: () => <div data-testid="getting-started-trial-section-stub" />,
}));

vi.mock("@/components/InAppHelpLink", () => ({
  InAppHelpLink: ({ label }: { label: string }) => <span>{label}</span>,
}));

vi.mock("@/components/CorePilotChecklist", () => ({
  CorePilotChecklist: () => <div data-testid="core-pilot-checklist-stub" />,
}));

vi.mock("./OnboardingOptionalSetupSection", () => ({
  OnboardingOptionalSetupSection: () => <div data-testid="onboarding-optional-setup-section-stub" />,
}));

describe("OnboardingPageView", () => {
  it("shows primary hero CTAs and progress section", () => {
    render(<OnboardingPageView model={{ fromRegistration: false }} />);

    expect(screen.getByTestId("onboarding-hero")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: BUYER_ONBOARDING_PAGE_TITLE })).toBeInTheDocument();
    expect(screen.getByText(BUYER_ONBOARDING_PAGE_LEAD)).toBeInTheDocument();
    expect(screen.queryByText(/intake|committed package/i)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: CREATE_ARCHITECTURE_LABEL })).toHaveAttribute("href", "/reviews/new");
    expect(screen.getByRole("link", { name: "Open sample review" })).toHaveAttribute(
      "href",
      `/reviews/${SHOWCASE_STATIC_DEMO_RUN_ID}`,
    );
    expect(screen.getByRole("heading", { name: "Progress" })).toBeInTheDocument();
    expect(screen.getByText(BUYER_ONBOARDING_WALKTHROUGH_HELP_LINK)).toBeInTheDocument();
    expect(screen.queryByText(/pilot|operator path/i)).not.toBeInTheDocument();
    expect(screen.getByTestId("core-pilot-checklist-stub")).toBeInTheDocument();
    expect(screen.getByTestId("onboarding-optional-setup-section-stub")).toBeInTheDocument();
    expect(screen.queryByTestId("getting-started-trial-section-stub")).not.toBeInTheDocument();
  });

  it("shows trial section when arriving from registration", () => {
    render(<OnboardingPageView model={{ fromRegistration: true }} />);

    expect(screen.getByTestId("getting-started-trial-section-stub")).toBeInTheDocument();
  });
});
