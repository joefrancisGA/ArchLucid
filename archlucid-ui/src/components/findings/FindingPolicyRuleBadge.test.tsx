import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FindingPolicyRuleBadge } from "@/components/findings/FindingPolicyRuleBadge";

describe("FindingPolicyRuleBadge", () => {
  it("renders a policy status tag linked to the rule deep link", () => {
    render(<FindingPolicyRuleBadge policyRuleId="sec-base-010" policyRuleLabel="Encrypt data at rest" />);
    expect(screen.getByTestId("finding-policy-rule-badge").className).toMatch(/underline/);

    const link = screen.getByTestId("finding-policy-rule-badge");
    expect(link).toHaveAttribute("href", "/governance/policy-packs?ruleId=sec-base-010");
    expect(link.className).toMatch(/underline/);
    expect(screen.getByText("Rule sec-base-010: Encrypt data at rest")).toBeInTheDocument();
  });

  it("returns null when rule id is blank", () => {
    const { container } = render(<FindingPolicyRuleBadge policyRuleId="   " />);
    expect(container).toBeEmptyDOMElement();
  });
});
