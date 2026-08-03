import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FindingPolicyEvidenceCitationLinks } from "@/components/findings/FindingPolicyEvidenceCitationLinks";

describe("FindingPolicyEvidenceCitationLinks", () => {
  it("renders policy and evidence links when model is populated", () => {
    render(
      <FindingPolicyEvidenceCitationLinks
        model={{
          pack: null,
          policy: {
            ruleId: "sec-base-001",
            ruleLabel: "Security baseline ingress rule",
            href: "/governance/policy-packs?ruleId=sec-base-001",
          },
          evidence: [
            {
              label: "Network security group rule",
              detail: "Lines 12-14",
              href: "/architecture/reviews/run-1/findings/f-1/evidence-trace",
            },
          ],
        }}
      />,
    );

    expect(screen.getByTestId("finding-policy-provenance-panel")).toBeTruthy();
    expect(screen.getByTestId("finding-policy-rule-badge")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Security baseline ingress rule/i })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Network security group rule" })).toHaveAttribute(
      "href",
      "/architecture/reviews/run-1/findings/f-1/evidence-trace",
    );
  });

  it("returns null when no citations are available", () => {
    const { container } = render(
      <FindingPolicyEvidenceCitationLinks
        model={{
          pack: null,
          policy: null,
          evidence: [],
        }}
      />,
    );

    expect(container.firstChild).toBeNull();
  });
});
