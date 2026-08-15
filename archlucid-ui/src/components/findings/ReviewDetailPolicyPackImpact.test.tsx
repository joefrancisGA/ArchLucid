import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ReviewDetailPolicyPackFindingsBreakdown } from "@/components/findings/ReviewDetailPolicyPackFindingsBreakdown";
import { ReviewDetailPolicyPackImpactCallout } from "@/components/findings/ReviewDetailPolicyPackImpactCallout";

describe("ReviewDetailPolicyPackImpactCallout", () => {
  it("surfaces governing pack links and simulate affordance", () => {
    render(
      <ReviewDetailPolicyPackImpactCallout
        ruleSetId="healthcare-claims-v3"
        ruleSetVersion="3.4.1"
        runId="run-abc"
        mappedFindingCount={4}
        totalFindingCount={5}
        cloudMismatchDetail="Azure-focused policy packs are selected while the cloud target is AWS."
      />,
    );

    expect(screen.getByTestId("review-detail-policy-pack-impact-callout")).toBeInTheDocument();
    expect(screen.getByTestId("review-detail-policy-pack-cloud-mismatch")).toHaveTextContent(
      "Azure-focused policy packs",
    );
    expect(screen.getByTestId("review-detail-policy-pack-impact-counts")).toHaveTextContent("4 of 5");
    expect(screen.getByTestId("review-detail-policy-pack-impact-view-pack")).toHaveAttribute(
      "href",
      "/governance/policy-packs/demo-healthcare-claims-pack",
    );
    expect(screen.getByTestId("review-detail-policy-pack-impact-edit-rules")).toHaveAttribute(
      "href",
      "/governance/policy-packs?tab=author&packId=healthcare-claims-v3",
    );
    expect(screen.getByTestId("review-detail-policy-pack-impact-simulate")).toHaveAttribute(
      "href",
      "/governance/policy-packs?packId=healthcare-claims-v3",
    );
    expect(screen.getByTestId("review-detail-policy-pack-impact-audit")).toHaveAttribute(
      "href",
      "/governance/audit?runId=run-abc",
    );
  });
});

describe("ReviewDetailPolicyPackFindingsBreakdown", () => {
  it("links each pack group and exposes simulate impact entry point", () => {
    render(
      <ReviewDetailPolicyPackFindingsBreakdown
        manifestRuleSetId="healthcare-claims-v3"
        mappedFindingCount={2}
        unmappedFindingCount={0}
        groups={[
          {
            groupKey: "security architecture baseline",
            packDisplayName: "Security Architecture Baseline",
            findingCount: 2,
            packHref: "/governance/policy-packs?ruleId=sec-base-001",
          },
        ]}
      />,
    );

    expect(screen.getByTestId("policy-pack-impact-counts")).toHaveTextContent("2 findings cite curated policy rules");
    expect(screen.getByTestId("policy-pack-breakdown-link-security architecture baseline")).toHaveAttribute(
      "href",
      "/governance/policy-packs?ruleId=sec-base-001",
    );
    expect(screen.getByTestId("policy-pack-impact-simulate-link")).toHaveAttribute(
      "href",
      "/governance/policy-packs?packId=healthcare-claims-v3",
    );
  });
});
