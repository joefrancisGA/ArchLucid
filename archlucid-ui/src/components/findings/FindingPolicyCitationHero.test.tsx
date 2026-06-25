import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { FindingPolicyCitationHero } from "@/components/findings/FindingPolicyCitationHero";

vi.mock("@/app/(operator)/reviews/[runId]/findings/[findingId]/FindingInspectPolicyRuleCallout", () => ({
  FindingInspectPolicyRuleCallout: () => (
    <div data-testid="finding-inspect-policy-rule-callout">Rule callout</div>
  ),
}));

describe("FindingPolicyCitationHero", () => {
  it("renders rule callout when policy link is present", () => {
    render(
      <FindingPolicyCitationHero
        model={{
          pack: {
            packId: "healthcare-claims-v3",
            packName: "Healthcare Claims Policy Pack v3",
            href: "/policy-packs?packId=healthcare-claims-v3",
          },
          policy: {
            ruleId: "sec-base-001",
            ruleLabel: "Security baseline ingress rule",
            href: "/policy-packs?ruleId=sec-base-001",
          },
          evidence: [],
        }}
      />,
    );

    expect(screen.getByTestId("finding-policy-citation-hero")).toBeInTheDocument();
    expect(screen.getByTestId("finding-inspect-policy-rule-callout")).toBeInTheDocument();
  });

  it("falls back to prominent provenance panel when only pack/evidence exists", () => {
    render(
      <FindingPolicyCitationHero
        model={{
          pack: {
            packId: "azure-wa",
            packName: "Azure Well-Architected",
            href: "/policy-packs?packId=azure-wa",
          },
          policy: null,
          evidence: [
            {
              label: "Network security group rule",
              detail: "Lines 12-14",
              href: "/reviews/run-1/findings/f-1/inspect",
            },
          ],
        }}
        traceExcerpt="Public ingress on port 443."
      />,
    );

    expect(screen.getByTestId("finding-policy-citation-hero")).toBeInTheDocument();
    expect(screen.getByTestId("finding-policy-provenance-panel")).toBeInTheDocument();
    expect(screen.getByText(/Triggered by policy/)).toBeInTheDocument();
  });

  it("returns null when no citation model data exists", () => {
    const { container } = render(
      <FindingPolicyCitationHero
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
