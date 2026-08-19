import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PrivacyPolicyBreadcrumb } from "@/components/marketing/privacy-policy/PrivacyPolicyBreadcrumb";
import { TRUST_CENTER_PUBLIC_PATH } from "@/lib/marketing-assurance-public-labels";

describe("PrivacyPolicyBreadcrumb", () => {
  it("links Trust Center and labels the current privacy policy page", () => {
    render(<PrivacyPolicyBreadcrumb />);

    expect(screen.getByTestId("privacy-policy-breadcrumb")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Trust Center" })).toHaveAttribute("href", TRUST_CENTER_PUBLIC_PATH);
    expect(screen.getByText("Privacy Policy")).toBeInTheDocument();
  });
});
