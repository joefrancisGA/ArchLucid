import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { GOVERNANCE_WORKSPACE_HEALTH_HREF } from "@/lib/governance/governance-route-paths";
import { PreCommitGovernanceBlockPanel } from "./PreCommitGovernanceBlockPanel";

describe("PreCommitGovernanceBlockPanel", () => {
  it("renders structured block payload with policy, finding, and guidance links", () => {
    render(
      <PreCommitGovernanceBlockPanel
        runId="run-abc"
        block={{
          reason: "Critical findings exceed the configured pre-commit threshold.",
          blockingFindingIds: ["finding-1", "finding-2"],
          policyPackId: "sec-baseline",
          minimumBlockingSeverityLabel: "Critical",
          blockExplanation: "Private endpoints are required for this workload class.",
        }}
      />,
    );

    expect(screen.getByTestId("pre-commit-governance-block-panel")).toHaveAttribute("role", "alert");
    expect(screen.getByText(/Critical findings exceed/i)).toBeInTheDocument();
    expect(screen.getByText(/Minimum blocking severity/i)).toHaveTextContent("Critical");

    expect(screen.getByTestId("pre-commit-governance-block-policy-pack-link")).toHaveAttribute(
      "href",
      "/governance/policy-packs?packId=sec-baseline",
    );

    expect(screen.getByTestId("pre-commit-governance-block-finding-link-finding-1")).toHaveAttribute(
      "href",
      "/architecture/reviews/run-abc/findings/finding-1",
    );

    expect(screen.getByTestId("pre-commit-governance-block-explanation")).toHaveTextContent(
      "Private endpoints are required",
    );

    expect(screen.getByTestId("pre-commit-governance-block-troubleshooting-link")).toHaveAttribute(
      "href",
      "/help/troubleshooting#governance-pre-commit-blocked",
    );

    expect(screen.getByTestId("pre-commit-governance-block-audit-link")).toHaveAttribute(
      "href",
      GOVERNANCE_WORKSPACE_HEALTH_HREF,
    );
  });
});
