import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FindingPolicyCitationProminentStrip } from "@/components/findings/FindingPolicyCitationProminentStrip";

describe("FindingPolicyCitationProminentStrip", () => {
  it("renders violation tag, triggered-by heading, and traceability badges", () => {
    render(
      <FindingPolicyCitationProminentStrip
        pack={{
          packId: "healthcare-claims-v3",
          packName: "Enterprise Privacy Policy Pack v3",
          href: "/governance/policy-packs?packId=healthcare-claims-v3",
        }}
        policy={{
          ruleId: "sec-base-001",
          ruleLabel: "Security baseline ingress rule",
          href: "/governance/policy-packs?ruleId=sec-base-001",
        }}
      />,
    );

    expect(screen.getByTestId("finding-policy-citation-prominent")).toBeInTheDocument();
    expect(screen.getByTestId("finding-policy-violation-tag")).toHaveTextContent(
      "Policy violation: Enterprise Privacy Policy Pack v3",
    );
    expect(screen.getByText(/Triggered by policy/)).toBeInTheDocument();
    expect(screen.getByTestId("finding-policy-pack-badge")).toBeInTheDocument();
    expect(screen.getByTestId("finding-policy-rule-badge")).toBeInTheDocument();
  });

  it("returns null when pack and policy are absent", () => {
    const { container } = render(<FindingPolicyCitationProminentStrip pack={null} policy={null} />);

    expect(container.firstChild).toBeNull();
  });

  it("hides helper copy in compact mode", () => {
    render(
      <FindingPolicyCitationProminentStrip
        compact
        pack={{
          packId: "azure-wa",
          packName: "Azure Well-Architected",
          href: "/governance/policy-packs?packId=azure-wa",
        }}
        policy={null}
      />,
    );

    expect(screen.queryByText(/Select a badge to preview the rule text/)).not.toBeInTheDocument();
  });
});
