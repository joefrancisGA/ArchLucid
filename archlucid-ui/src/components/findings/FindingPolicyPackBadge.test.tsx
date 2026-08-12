import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FindingPolicyPackBadge } from "@/components/findings/FindingPolicyPackBadge";

describe("FindingPolicyPackBadge", () => {
  it("renders a linked pack badge by default", () => {
    render(
      <FindingPolicyPackBadge
        policyPackId="healthcare-claims-v3"
        policyPackLabel="Healthcare Claims Policy Pack v3"
      />,
    );

    const link = screen.getByTestId("finding-policy-pack-badge");
    expect(link).toHaveAttribute("href", "/governance/policy-packs?packId=healthcare-claims-v3");
    expect(link.className).toMatch(/underline/);
    expect(screen.getByText("Pack Healthcare Claims Policy Pack v3")).toBeInTheDocument();
  });

  it("renders a button when preview click handler is provided", () => {
    render(
      <FindingPolicyPackBadge
        policyPackId="healthcare-claims-v3"
        policyPackLabel="Healthcare Claims Policy Pack v3"
        onPreviewClick={() => undefined}
      />,
    );

    expect(screen.getByRole("button", { name: /Pack Healthcare Claims Policy Pack v3/i })).toBeTruthy();
  });
});
