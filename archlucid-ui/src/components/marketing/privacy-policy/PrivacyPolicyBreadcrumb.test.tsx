import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PrivacyPolicyBreadcrumb } from "@/components/marketing/privacy-policy/PrivacyPolicyBreadcrumb";
import { TRUST_CENTER_PUBLIC_PATH } from "@/lib/marketing-assurance-public-labels";

describe("PrivacyPolicyBreadcrumb", () => {
  it("defers to page titles after TB-2090 breadcrumb removal", () => {
    render(<PrivacyPolicyBreadcrumb />);

    expect(screen.queryByTestId("privacy-policy-breadcrumb")).not.toBeInTheDocument();
    expect(TRUST_CENTER_PUBLIC_PATH.length).toBeGreaterThan(0);
  });
});
