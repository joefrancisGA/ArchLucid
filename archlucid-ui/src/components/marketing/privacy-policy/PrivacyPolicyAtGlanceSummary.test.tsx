import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PrivacyPolicyAtGlanceSummary } from "@/components/marketing/privacy-policy/PrivacyPolicyAtGlanceSummary";

describe("PrivacyPolicyAtGlanceSummary", () => {
  it("renders a summary disclaimer and key policy bullets", () => {
    render(<PrivacyPolicyAtGlanceSummary />);

    expect(screen.getByTestId("privacy-policy-at-glance")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "At a glance" })).toBeInTheDocument();
    expect(screen.getByText(/Summary only/)).toBeInTheDocument();
    expect(screen.getByText(/What we collect:/)).toBeInTheDocument();
    expect(screen.getByText(/Your rights:/)).toBeInTheDocument();
  });
});
