import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EnterpriseOnboardingHelpEvidenceOrientationStrip } from "@/app/(operator)/help/_sections/EnterpriseOnboardingHelpEvidenceOrientationStrip";
import {
  ENTERPRISE_ONBOARDING_HELP_CANONICAL_PATH,
  ENTERPRISE_ONBOARDING_HELP_SOURCES,
} from "@/lib/enterprise-onboarding-help-evidence-copy";

describe("EnterpriseOnboardingHelpEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking enterprise-onboarding help", () => {
    render(<EnterpriseOnboardingHelpEvidenceOrientationStrip />);

    expect(screen.getByTestId("enterprise-onboarding-help-sources")).toBeInTheDocument();
    expect(screen.getByTestId("enterprise-onboarding-help-claim-discipline")).toBeInTheDocument();

    for (const link of ENTERPRISE_ONBOARDING_HELP_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(
      ENTERPRISE_ONBOARDING_HELP_SOURCES.some(
        (link) => link.href === ENTERPRISE_ONBOARDING_HELP_CANONICAL_PATH,
      ),
    ).toBe(false);
  });
});
