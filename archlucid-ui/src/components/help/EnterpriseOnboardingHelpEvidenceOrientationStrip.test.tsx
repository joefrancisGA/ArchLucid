import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectFollowUpLink } from "@/lib/claim-discipline-test-helpers";

import { EnterpriseOnboardingHelpEvidenceOrientationStrip } from "@/components/help/EnterpriseOnboardingHelpEvidenceOrientationStrip";
import {
  ENTERPRISE_ONBOARDING_HELP_CLAIM_DISCIPLINE,
  ENTERPRISE_ONBOARDING_HELP_FOLLOW_UPS_TITLE,
  ENTERPRISE_ONBOARDING_HELP_SOURCES,
} from "@/lib/enterprise-onboarding-help-evidence-copy";

describe("EnterpriseOnboardingHelpEvidenceOrientationStrip", () => {
  it("renders claim discipline and related setup pages without diligence artifact vocabulary", () => {
    render(<EnterpriseOnboardingHelpEvidenceOrientationStrip />);

    expect(screen.getByTestId("enterprise-onboarding-help-claim-discipline")).toHaveTextContent(
      ENTERPRISE_ONBOARDING_HELP_CLAIM_DISCIPLINE,
    );
    expect(screen.getByTestId("enterprise-onboarding-help-sources")).toHaveTextContent(
      ENTERPRISE_ONBOARDING_HELP_FOLLOW_UPS_TITLE,
    );
    expect(screen.queryByText(/Diligence artifact/i)).toBeNull();
    expect(screen.queryByText(/Sources package/i)).toBeNull();

    for (const link of ENTERPRISE_ONBOARDING_HELP_SOURCES) {
      expectFollowUpLink(screen, link);
    }

    expect(screen.queryByRole("link", { name: "Hosted SaaS enterprise onboarding checklist" })).toBeNull();
  });
});
