import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CompareGovernanceDiffPanel } from "@/app/(operator)/insights/compare-two-reviews/_sections/CompareGovernanceDiffPanel";
import {
  buildCompareEffectiveGovernanceSnapshot,
  buildCompareGovernanceDiffView,
  parseCompareManifestGovernanceSnapshot,
} from "@/lib/compare-effective-governance-diff";
import type { EffectivePolicyPackSet, PolicyPackContentDocument } from "@/types/policy-packs";

describe("CompareGovernanceDiffPanel", () => {
  it("renders policy-at-commit sections when manifest snapshots exist", () => {
    const view = buildCompareGovernanceDiffView({
      baselineManifest: parseCompareManifestGovernanceSnapshot({
        ruleSetId: "pack-a",
        ruleSetVersion: "1.0.0",
        effectiveGovernanceAtCommit: {
          complianceRuleKeyCount: 1,
          complianceRuleKeys: ["sec-base-010"],
          conflictCount: 0,
          packAssignments: [
            {
              policyPackId: "pack-a",
              policyPackVersion: "1.0.0",
              scopeLevel: "Project",
            },
          ],
          hasEffectivePolicy: true,
        },
      }),
      targetManifest: parseCompareManifestGovernanceSnapshot({
        ruleSetId: "pack-b",
        ruleSetVersion: "2.0.0",
        effectiveGovernanceAtCommit: {
          complianceRuleKeyCount: 1,
          complianceRuleKeys: ["sec-base-010"],
          conflictCount: 0,
          packAssignments: [],
          hasEffectivePolicy: true,
        },
      }),
      currentEffective: null,
    });

    render(<CompareGovernanceDiffPanel view={view} loading={false} softFailureMessage={null} />);

    expect(screen.getByTestId("compare-governance-at-commit-section")).toBeInTheDocument();
    expect(screen.getByTestId("policy-pack-influence-honesty-chip")).toBeInTheDocument();
    expect(screen.getByTestId("compare-governance-baseline-at-commit")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "pack-a" })).toHaveAttribute(
      "href",
      "/governance/policy-packs/pack-a",
    );
    expect(screen.queryByTestId("compare-governance-current-effective-disclaimer")).not.toBeInTheDocument();
  });

  it("renders rule set change and current effective disclaimer", () => {
    const effective: EffectivePolicyPackSet = {
      tenantId: "t",
      workspaceId: "w",
      projectId: "p",
      packs: [
        {
          policyPackId: "pack-b",
          name: "Pack B",
          version: "2.0.0",
          packType: "PlatformDefault",
          contentJson: "{}",
        },
      ],
    };
    const content: PolicyPackContentDocument = {
      complianceRuleIds: [],
      complianceRuleKeys: ["sec-base-010"],
      alertRuleIds: [],
      compositeAlertRuleIds: [],
      advisoryDefaults: {},
      metadata: {},
    };

    const view = buildCompareGovernanceDiffView({
      baselineManifest: parseCompareManifestGovernanceSnapshot({
        ruleSetId: "pack-a",
        ruleSetVersion: "1.0.0",
      }),
      targetManifest: parseCompareManifestGovernanceSnapshot({
        ruleSetId: "pack-b",
        ruleSetVersion: "2.0.0",
      }),
      currentEffective: buildCompareEffectiveGovernanceSnapshot(effective, content),
    });

    render(<CompareGovernanceDiffPanel view={view} loading={false} softFailureMessage={null} />);

    expect(screen.getByTestId("compare-governance-diff-panel")).toBeInTheDocument();
    expect(screen.getByTestId("compare-governance-current-effective-disclaimer")).toBeInTheDocument();
    expect(screen.getByTestId("compare-governance-rule-set-changes")).toBeInTheDocument();
    expect(screen.getByText(/pack-a v1.0.0/)).toBeInTheDocument();
    expect(screen.getByText(/pack-b v2.0.0/)).toBeInTheDocument();
  });

  it("shows loading state without blocking layout", () => {
    render(<CompareGovernanceDiffPanel view={null} loading softFailureMessage={null} />);

    expect(screen.getByTestId("compare-governance-diff-loading")).toBeInTheDocument();
  });

  it("surfaces per-side policy-pack cloud mismatch callouts (TB-2322)", () => {
    const view = buildCompareGovernanceDiffView({
      baselineManifest: parseCompareManifestGovernanceSnapshot({
        ruleSetId: "cis-azure",
        ruleSetVersion: "1.0.0",
      }),
      targetManifest: parseCompareManifestGovernanceSnapshot({
        ruleSetId: "aws-security",
        ruleSetVersion: "2.0.0",
      }),
      currentEffective: null,
    });

    render(
      <CompareGovernanceDiffPanel
        view={view}
        loading={false}
        softFailureMessage={null}
        baselineCloudMismatchDetail="Azure-focused policy packs are selected while the cloud target is AWS."
        targetCloudMismatchDetail="Azure-focused policy packs are selected while the cloud target is Google Cloud."
      />,
    );

    expect(screen.getByTestId("compare-governance-baseline-cloud-mismatch")).toHaveTextContent("AWS");
    expect(screen.getByTestId("compare-governance-target-cloud-mismatch")).toHaveTextContent("Google Cloud");
  });

  it("links to policy pack impact preview when target run and rule set delta exist", () => {
    const view = buildCompareGovernanceDiffView({
      baselineManifest: parseCompareManifestGovernanceSnapshot({
        ruleSetId: "pack-a",
        ruleSetVersion: "1.0.0",
        effectiveGovernanceAtCommit: {
          complianceRuleKeyCount: 1,
          complianceRuleKeys: ["sec-base-010"],
          conflictCount: 0,
          packAssignments: [
            {
              policyPackId: "pack-a",
              policyPackVersion: "1.0.0",
              scopeLevel: "Project",
            },
          ],
          hasEffectivePolicy: true,
        },
      }),
      targetManifest: parseCompareManifestGovernanceSnapshot({
        ruleSetId: "pack-b",
        ruleSetVersion: "2.0.0",
        effectiveGovernanceAtCommit: {
          complianceRuleKeyCount: 1,
          complianceRuleKeys: ["sec-base-010"],
          conflictCount: 0,
          packAssignments: [
            {
              policyPackId: "pack-b",
              policyPackVersion: "2.0.0",
              scopeLevel: "Project",
            },
          ],
          hasEffectivePolicy: true,
        },
      }),
      currentEffective: null,
    });

    render(
      <CompareGovernanceDiffPanel
        view={view}
        loading={false}
        softFailureMessage={null}
        targetRunId="run-target"
      />,
    );

    expect(screen.getByRole("link", { name: "Open pack impact preview for this comparison" })).toHaveAttribute(
      "href",
      "/governance/policy-packs?reviewId=run-target&packAId=pack-a&packBId=pack-b",
    );
  });

  it("states policy at commit was not stored on both sides when snapshots are missing", () => {
    const view = buildCompareGovernanceDiffView({
      baselineManifest: parseCompareManifestGovernanceSnapshot({ ruleSetId: "pack-a" }),
      targetManifest: parseCompareManifestGovernanceSnapshot({ ruleSetId: "pack-b" }),
      currentEffective: null,
    });

    render(<CompareGovernanceDiffPanel view={view} loading={false} softFailureMessage={null} />);

    expect(screen.getAllByText("Policy at commit was not stored.")).toHaveLength(2);
  });

  it("states rule set version was not stored when only id is present", () => {
    const view = buildCompareGovernanceDiffView({
      baselineManifest: parseCompareManifestGovernanceSnapshot({ ruleSetId: "pack-a", ruleSetVersion: null }),
      targetManifest: parseCompareManifestGovernanceSnapshot({ ruleSetId: "pack-b", ruleSetVersion: null }),
      currentEffective: null,
    });

    render(<CompareGovernanceDiffPanel view={view} loading={false} softFailureMessage={null} />);

    expect(screen.getAllByText(/Rule set version was not stored\./)).toHaveLength(2);
  });

  it("labels missing rule set change sides without Not returned", () => {
    const view = {
      ...buildCompareGovernanceDiffView({
        baselineManifest: parseCompareManifestGovernanceSnapshot({
          ruleSetId: "pack-a",
          ruleSetVersion: "1.0.0",
        }),
        targetManifest: parseCompareManifestGovernanceSnapshot({
          ruleSetId: "pack-b",
          ruleSetVersion: "2.0.0",
        }),
        currentEffective: null,
      }),
      manifestRuleSetChanges: [
        {
          field: "ruleSetVersion",
          baselineValue: null,
          targetValue: "",
        },
      ],
    };

    render(<CompareGovernanceDiffPanel view={view} loading={false} softFailureMessage={null} />);

    expect(screen.getByText(/Baseline value was not stored\. → Updated value was stored empty\./)).toBeInTheDocument();
  });
});
