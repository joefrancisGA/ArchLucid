import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EnterpriseOnboardingHubSteps } from "@/components/help/EnterpriseOnboardingHubSteps";
import { ENTERPRISE_ONBOARDING_HUB_STEPS } from "@/lib/enterprise-onboarding-hub-steps";

describe("EnterpriseOnboardingHubSteps", () => {
  it("renders tracked step list with owners, status tags, and deep links", () => {
    render(<EnterpriseOnboardingHubSteps />);

    expect(screen.getByTestId("enterprise-onboarding-hub-progress")).toHaveTextContent(
      `0 of ${ENTERPRISE_ONBOARDING_HUB_STEPS.length} steps tracked in ArchLucid`,
    );

    for (const [index, step] of ENTERPRISE_ONBOARDING_HUB_STEPS.entries()) {
      const row = screen.getByTestId(`enterprise-onboarding-hub-step-${index + 1}`);

      expect(row).toHaveTextContent(step.owner);
      expect(row).toHaveTextContent("Tracked outside ArchLucid");
      expect(screen.getByRole("link", { name: step.primaryLink.label })).toHaveAttribute(
        "href",
        step.primaryLink.href,
      );
    }
  });
});
