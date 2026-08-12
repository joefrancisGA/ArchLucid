import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { FindingPolicyTraceabilityBadges } from "@/components/findings/FindingPolicyTraceabilityBadges";

vi.mock("@/lib/api/policy-governance-api", () => ({
  getEffectivePolicyPacks: vi.fn(async () => ({ packs: [] })),
}));

describe("FindingPolicyTraceabilityBadges", () => {
  it("opens policy rule preview dialog when rule badge is clicked", () => {
    render(
      <FindingPolicyTraceabilityBadges
        pack={{
          packId: "healthcare-claims-v3",
          packName: "Healthcare Claims Policy Pack v3",
          href: "/governance/policy-packs?packId=healthcare-claims-v3",
        }}
        policy={{
          ruleId: "sec-base-010",
          ruleLabel: "Encrypt data at rest",
          href: "/governance/policy-packs?ruleId=sec-base-010",
        }}
      />,
    );

    fireEvent.click(screen.getByTestId("finding-policy-rule-badge"));

    expect(screen.getByTestId("policy-rule-preview-dialog")).toBeTruthy();
    expect(screen.getByText("sec-base-010")).toBeTruthy();
    expect(screen.getByText("Encrypt data at rest")).toBeTruthy();
  });
});
