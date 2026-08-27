import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EnterpriseOnboardingHubSteps } from "@/components/help/EnterpriseOnboardingHubSteps";
import { ENTERPRISE_ONBOARDING_HUB_STEPS } from "@/lib/enterprise-onboarding-hub-steps";

describe("EnterpriseOnboardingHubSteps", () => {
  it("renders eight-step index with owners, recommended next, and deep links", () => {
    render(<EnterpriseOnboardingHubSteps />);

    expect(screen.queryByTestId("enterprise-onboarding-hub-progress")).toBeNull();
    expect(screen.getByTestId("enterprise-onboarding-hub-recommended-next")).toHaveTextContent("Recommended next");
    expect(screen.getByTestId("enterprise-onboarding-hub-recommended-next").className).not.toMatch(/teal/);

    for (const [index, step] of ENTERPRISE_ONBOARDING_HUB_STEPS.entries()) {
      const row = screen.getByTestId(`enterprise-onboarding-hub-step-${index + 1}`);

      expect(row).toHaveTextContent(step.owner);
      expect(row).not.toHaveTextContent("Tracked outside ArchLucid");

      if (step.primaryLink.href.startsWith("#")) {
        const titleLink = within(row).getByRole("link", { name: `${index + 1}. ${step.title}` });

        expect(titleLink).toHaveAttribute("href", step.primaryLink.href);
        expect(withinRowNamedLink(row, step.primaryLink.label)).toBeNull();
      } else {
        expect(screen.getByRole("link", { name: step.primaryLink.label })).toHaveAttribute(
          "href",
          step.primaryLink.href,
        );
      }
    }
  });
});

function withinRowNamedLink(row: HTMLElement, linkName: string): HTMLElement | null {
  const matches = Array.from(row.querySelectorAll("a")).filter((link) => link.textContent?.trim() === linkName);

  return matches[0] ?? null;
}
