import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EnterpriseOnboardingHelpEvidenceOrientationStrip } from "@/components/help/EnterpriseOnboardingHelpEvidenceOrientationStrip";
import {
  ENTERPRISE_ONBOARDING_HELP_CLAIM_DISCIPLINE,
  ENTERPRISE_ONBOARDING_HELP_RELATED_PAGES_TITLE,
  ENTERPRISE_ONBOARDING_HELP_SOURCES,
} from "@/lib/enterprise-onboarding-help-evidence-copy";

describe("EnterpriseOnboardingHelpEvidenceOrientationStrip", () => {
  it("renders claim discipline and related setup pages without diligence artifact vocabulary", () => {
    render(<EnterpriseOnboardingHelpEvidenceOrientationStrip />);

    expect(screen.getByTestId("enterprise-onboarding-help-claim-discipline")).toHaveTextContent(
      ENTERPRISE_ONBOARDING_HELP_CLAIM_DISCIPLINE,
    );
    expect(screen.getByTestId("enterprise-onboarding-help-sources")).toHaveTextContent(
      ENTERPRISE_ONBOARDING_HELP_RELATED_PAGES_TITLE,
    );
    expect(screen.queryByText(/Diligence artifact/i)).toBeNull();
    expect(screen.queryByText(/Sources package/i)).toBeNull();

    for (const link of ENTERPRISE_ONBOARDING_HELP_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(screen.queryByRole("link", { name: "Hosted SaaS enterprise onboarding checklist" })).toBeNull();
  });
});
