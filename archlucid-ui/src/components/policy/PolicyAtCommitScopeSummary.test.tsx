import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PolicyAtCommitScopeSummary } from "@/components/policy/PolicyAtCommitScopeSummary";

describe("PolicyAtCommitScopeSummary", () => {
  it("lists pack assignments and coverage exclusions at commit", () => {
    render(
      <PolicyAtCommitScopeSummary
        snapshot={{
          generatedUtc: null,
          ruleSetHash: null,
          complianceRuleKeyCount: 2,
          complianceRuleKeys: [],
          conflictCount: 1,
          hasEffectivePolicy: true,
          packAssignments: [
            {
              policyPackId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
              policyPackVersion: "1.2.0",
              scopeLevel: "Tenant",
            },
          ],
          coverageAssignments: [
            {
              policyPackId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
              policyPackVersion: "1.2.0",
              coverageType: "QualityDimension",
              selectionState: "RecommendedButExcluded",
              qualityDimension: "Reliability",
              exclusionReason: "Out of pilot scope",
            },
          ],
        }}
        testIdPrefix="policy-at-commit-test"
      />,
    );

    expect(screen.getByTestId("policy-at-commit-test-summary")).toBeInTheDocument();
    expect(screen.getByTestId("policy-at-commit-test-packs")).toHaveTextContent("Tenant");
    expect(screen.getByTestId("policy-at-commit-test-exclusions")).toHaveTextContent("Out of pilot scope");
    expect(screen.getByTestId("policy-at-commit-test-coverage")).toHaveTextContent("Reliability");
    expect(screen.getByTestId("policy-at-commit-test-counts")).toHaveTextContent("merge conflict");
  });

  it("does not invent a policy pack detail link when none is stored (P-03)", () => {
    render(
      <PolicyAtCommitScopeSummary
        snapshot={{
          generatedUtc: null,
          ruleSetHash: null,
          complianceRuleKeyCount: 0,
          complianceRuleKeys: [],
          conflictCount: 0,
          hasEffectivePolicy: true,
          packAssignments: [
            {
              policyPackId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
              policyPackVersion: "1.0.0",
              scopeLevel: "Tenant",
            },
          ],
          coverageAssignments: [],
        }}
        testIdPrefix="policy-at-commit-link-test"
      />,
    );

    expect(screen.getByText(/Policy pack detail link was not stored\./)).toBeInTheDocument();
    expect(screen.queryByRole("link")).toBeNull();
  });
});
