import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { FindingInspectPolicyRuleCallout } from "./FindingInspectPolicyRuleCallout";

const { curatedMetadata } = vi.hoisted(() => ({
  curatedMetadata: JSON.stringify({
    schemaVersion: 1,
    kind: "archlucid.policyPack.curatedRules.v1",
    pack: { name: "Security Architecture Baseline", version: "1.0.0" },
    rules: [
      {
        id: "sec-base-001",
        title: "Deny public ingress",
        description: "Internet-facing ingress must use private endpoints or approved WAF patterns.",
        severity: "High",
        remediationGuidance: "Replace public load balancers with private ingress.",
        evidenceHints: [],
        frameworkMappings: [],
      },
    ],
  }),
}));

vi.mock("@/lib/api/policy-governance-api", () => ({
  getEffectivePolicyPacks: vi.fn(async () => ({
    tenantId: "tenant-1",
    workspaceId: "workspace-1",
    projectId: "project-1",
    packs: [
      {
        policyPackId: "sec-pack",
        name: "Security Architecture Baseline",
        version: "1.0.0",
        packType: "Platform",
        contentJson: JSON.stringify({
          complianceRuleKeys: ["sec-base-001"],
          complianceRuleIds: [],
          alertRuleIds: [],
          compositeAlertRuleIds: [],
          advisoryDefaults: {},
          metadata: { "pack.curatedRules.v1": curatedMetadata },
        }),
      },
    ],
  })),
}));

describe("FindingInspectPolicyRuleCallout", () => {
  it("renders rule id and retrieved rule text prominently", async () => {
    render(
      <FindingInspectPolicyRuleCallout
        pack={{
          packId: "sec-pack",
          packName: "Security Architecture Baseline",
          href: "/governance/policy-packs?packId=sec-pack",
        }}
        policy={{
          ruleId: "sec-base-001",
          ruleLabel: "Deny public ingress",
          href: "/governance/policy-packs?ruleId=sec-base-001",
        }}
      />,
    );

    expect(screen.getByTestId("finding-inspect-policy-violation-tag")).toHaveTextContent(
      "Policy violation: Security Architecture Baseline",
    );

    await waitFor(() => {
      expect(screen.getByTestId("finding-inspect-policy-rule-id")).toHaveTextContent("sec-base-001");
      expect(screen.getByTestId("finding-inspect-policy-rule-text")).toHaveTextContent(
        "Internet-facing ingress must use private endpoints or approved WAF patterns.",
      );
    });
  });
});
