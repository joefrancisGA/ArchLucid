import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/help/enterprise-onboarding",
}));
import {
  expectClaimDisciplineBandContent,
  expectWhereToGoNextFollowUpLinks,
} from "@/lib/claim-discipline-test-helpers";

import { EnterpriseOnboardingHelpEvidenceOrientationStrip } from "@/components/help/EnterpriseOnboardingHelpEvidenceOrientationStrip";
import {
  ENTERPRISE_ONBOARDING_HELP_CLAIM_DISCIPLINE,
  ENTERPRISE_ONBOARDING_HELP_CANONICAL_PATH,
  ENTERPRISE_ONBOARDING_HELP_FOLLOW_UPS_TITLE,
  ENTERPRISE_ONBOARDING_HELP_SOURCES,
} from "@/lib/enterprise-onboarding-help-evidence-copy";

describe("EnterpriseOnboardingHelpEvidenceOrientationStrip", () => {
  it("renders follow-up links without duplicate claim discipline when the strip slug is omitted", () => {
    render(<EnterpriseOnboardingHelpEvidenceOrientationStrip />);

    expectClaimDisciplineBandContent(
      screen,
      "enterprise-onboarding-help",
      "enterprise-onboarding-help-claim-discipline",
      ENTERPRISE_ONBOARDING_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.getByTestId("enterprise-onboarding-help-sources")).toHaveTextContent(
      ENTERPRISE_ONBOARDING_HELP_FOLLOW_UPS_TITLE,
    );
    expect(screen.queryByText(/Diligence artifact/i)).toBeNull();
    expect(screen.queryByText(/Sources package/i)).toBeNull();

    expectWhereToGoNextFollowUpLinks(
      screen,
      ENTERPRISE_ONBOARDING_HELP_SOURCES,
      ENTERPRISE_ONBOARDING_HELP_CANONICAL_PATH,
    );

    expect(screen.queryByRole("link", { name: "Hosted SaaS enterprise onboarding checklist" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Open Identity providers" })).toBeNull();
  });
});
