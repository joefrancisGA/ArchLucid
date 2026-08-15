import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FindingPolicyProvenancePanel } from "@/components/findings/FindingPolicyProvenancePanel";

describe("FindingPolicyProvenancePanel", () => {
  it("renders policy pack, rule, evidence, and trace excerpt when populated", () => {
    render(
      <FindingPolicyProvenancePanel
        model={{
          pack: {
            packId: "healthcare-claims-v3",
            packName: "Enterprise Privacy Policy Pack v3",
            href: "/governance/policy-packs?packId=healthcare-claims-v3",
          },
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
        traceExcerpt="Uploaded evidence shows public ingress on port 443, which violates the pack rule."
      />,
    );

    expect(screen.getByTestId("finding-policy-provenance-panel")).toBeTruthy();
    expect(screen.getByTestId("finding-policy-violation-tag")).toHaveTextContent(
      "Policy violation: Enterprise Privacy Policy Pack v3",
    );
    expect(screen.getByTestId("finding-policy-traceability-badges")).toBeTruthy();
    expect(screen.getByTestId("finding-policy-pack-badge")).toBeTruthy();
    expect(screen.getByTestId("finding-policy-rule-badge")).toBeTruthy();
    expect(screen.getByTestId("finding-policy-trace-excerpt")).toHaveTextContent("public ingress on port 443");
  });

  it("uses prominent styling when variant is prominent", () => {
    render(
      <FindingPolicyProvenancePanel
        variant="prominent"
        model={{
          pack: {
            packId: "azure-wa",
            packName: "Azure Well-Architected",
            href: "/governance/policy-packs?packId=azure-wa",
          },
          policy: {
            ruleId: "sec-001",
            ruleLabel: "SEC-001",
            href: "/governance/policy-packs?ruleId=sec-001",
          },
          evidence: [],
        }}
      />,
    );

    expect(screen.getByText(/Triggered by policy/)).toBeInTheDocument();
    expect(screen.getByTestId("finding-policy-provenance-panel")).toHaveClass("border-teal-300/80");
  });

  it("returns null when no provenance is available", () => {
    const { container } = render(
      <FindingPolicyProvenancePanel
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
