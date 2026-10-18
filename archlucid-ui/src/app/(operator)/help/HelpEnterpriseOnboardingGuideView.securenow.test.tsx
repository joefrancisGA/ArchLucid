import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

vi.mock("@/components/product-line/ProductLineProvider", () => ({
  useProductLine: () => ({ productLine: "security" }),
}));

import { HelpEnterpriseOnboardingGuideView } from "@/app/(operator)/help/_sections/HelpEnterpriseOnboardingGuideView";
import {
  SECURENOW_ENTERPRISE_ONBOARDING_HELP_HERO_OVERVIEW,
  SECURENOW_ENTERPRISE_ONBOARDING_HELP_PAGE_SUBTITLE,
} from "@/lib/enterprise-onboarding-help-copy";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpEnterpriseOnboardingGuideView SecureNow shell", () => {
  const entry = getProductDocumentationEntry("enterprise-onboarding");

  it("orients tenant admins without first architecture review CTAs", () => {
    if (entry === undefined) {
      throw new Error("Expected enterprise-onboarding documentation entry.");
    }

    render(<HelpEnterpriseOnboardingGuideView entry={entry} markdown="" />);

    expect(screen.getByText(SECURENOW_ENTERPRISE_ONBOARDING_HELP_PAGE_SUBTITLE)).toBeInTheDocument();
    expect(screen.getByText(SECURENOW_ENTERPRISE_ONBOARDING_HELP_HERO_OVERVIEW)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /your first architecture review/i })).toBeNull();
    expect(screen.queryByRole("link", { name: /core pilot/i })).toBeNull();
    expect(screen.getByRole("link", { name: /extract and upload inventory/i })).toHaveAttribute(
      "href",
      "/infrastructure/manual-upload",
    );
    expect(screen.getByTestId("enterprise-onboarding-hub-step-6")).toHaveTextContent("findings");
    expect(screen.queryByText("Validate first architecture review")).toBeNull();
  });
});
