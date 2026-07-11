import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { GovernanceSetupGuidePageView } from "@/app/(operator)/governance/first-30-days/_sections/GovernanceSetupGuidePageView";
import {
  GOVERNANCE_SETUP_FOUNDATION_INDICATORS,
  GOVERNANCE_SETUP_GUIDE_STEPS,
} from "@/app/(operator)/governance/first-30-days/_sections/governance-setup-guide-steps";

describe("GovernanceSetupGuidePageView", () => {
  it("renders compact governance setup copy without implementation jargon", () => {
    render(
      <GovernanceSetupGuidePageView
        model={{
          steps: GOVERNANCE_SETUP_GUIDE_STEPS,
          foundationIndicators: GOVERNANCE_SETUP_FOUNDATION_INDICATORS,
          stepStatuses: ["not-started", "not-started", "not-started", "not-started", "not-started"],
        }}
      />,
    );

    expect(screen.getByTestId("governance-setup-page-title")).toHaveTextContent("Governance setup");
    expect(screen.getByText("First 30 days")).toBeInTheDocument();
    expect(screen.getByTestId("governance-setup-progress-summary")).toHaveTextContent("0 of 5 completed");
    expect(screen.getByTestId("governance-setup-configuration-note")).toHaveTextContent(
      "This guide links to the existing ArchLucid configuration areas.",
    );
    expect(screen.queryByText(/inspect-first/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/deep links only/i)).not.toBeInTheDocument();
    expect(screen.getByTestId("governance-setup-recommended-step")).toHaveTextContent("Set the policy baseline");
    expect(screen.getByRole("link", { name: "Configure policy packs" })).toHaveAttribute(
      "href",
      "/governance/policy-packs",
    );
    expect(screen.getByTestId("governance-setup-foundation-panel")).toBeInTheDocument();
  });

  it("shows status badges and primary actions on every step", () => {
    render(
      <GovernanceSetupGuidePageView
        model={{
          steps: GOVERNANCE_SETUP_GUIDE_STEPS,
          foundationIndicators: GOVERNANCE_SETUP_FOUNDATION_INDICATORS,
          stepStatuses: ["complete", "in-progress", "not-started", "not-started", "not-started"],
        }}
      />,
    );

    expect(screen.getByTestId("governance-setup-progress-summary")).toHaveTextContent("1 of 5 completed");
    expect(screen.getAllByText("Complete")).toHaveLength(2);
    expect(screen.getAllByText("Not started")).toHaveLength(3);
    expect(screen.getByText("In progress")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Check connector readiness" })).toHaveAttribute(
      "href",
      "/integrations/readiness",
    );
  });
});
