import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ResponsibleAiPolicyPackDetail } from "@/app/(operator)/governance/policy-packs/[id]/ResponsibleAiPolicyPackDetail";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

describe("ResponsibleAiPolicyPackDetail", () => {
  it("renders assign primary action, breadcrumb, and template baseline qualifier for sample packs", () => {
    render(
      <ResponsibleAiPolicyPackDetail
        policyPackId="1"
        packRecord={null}
        packContent={null}
        isSample
        isEnabled={false}
        isGloballyActive={false}
      />,
    );

    expect(screen.getByTestId("governance-policy-pack-breadcrumb")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Assign to workspace" })).toHaveAttribute(
      "href",
      "/governance/policy-packs?packId=1",
    );
    expect(screen.getByRole("link", { name: "Start review with this pack" })).toHaveAttribute(
      "href",
      "/architecture/reviews/new?packId=1",
    );
    expect(screen.getByRole("link", { name: "Open policy pack library" })).toHaveAttribute(
      "href",
      "/governance/policy-packs",
    );
    expect(screen.getByTestId("policy-pack-sample-tag")).toHaveTextContent("Sample policy pack");
    expect(screen.getByTestId("policy-pack-status-badge")).toHaveTextContent("Unavailable");
    expect(screen.getByTestId("policy-pack-rules-source-qualifier")).toHaveTextContent("Platform template baseline");
    expect(screen.getByTestId("policy-pack-rules-intro")).toHaveTextContent(
      "All rules are required for AI-enabled architecture reviews.",
    );
    expect(screen.queryByRole("columnheader", { name: "Status" })).not.toBeInTheDocument();
    expect(screen.getByTestId("policy-pack-open-findings-link")).toHaveAttribute("href", "/governance/findings");
    expect(screen.queryByTestId("policy-pack-detail-actions")).not.toBeInTheDocument();
  });

  it("shows workspace enablement and pack-bound rules when pack content exists", () => {
    render(
      <ResponsibleAiPolicyPackDetail
        policyPackId="pack-42"
        packRecord={{
          policyPackId: "pack-42",
          tenantId: "t",
          workspaceId: "w",
          projectId: "p",
          name: "Responsible AI",
          description: "",
          packType: "BuiltIn",
          distributionScope: "Platform",
          status: "Active",
          createdUtc: "2026-06-01T00:00:00.000Z",
          currentVersion: "1.0.0",
        }}
        packContent={{
          complianceRuleIds: [],
          complianceRuleKeys: ["ai-gov-001"],
          alertRuleIds: [],
          compositeAlertRuleIds: [],
          advisoryDefaults: {},
          metadata: {},
        }}
        isSample={false}
        isEnabled
        isGloballyActive
      />,
    );

    expect(screen.getByTestId("policy-pack-status-badge")).toHaveTextContent("Active");
    expect(screen.getByText("Enabled")).toBeInTheDocument();
    expect(screen.getByText("Workspace")).toBeInTheDocument();
    expect(screen.getByText("Ai Gov 001")).toBeInTheDocument();
    expect(screen.queryByTestId("policy-pack-rules-source-qualifier")).not.toBeInTheDocument();
  });
});
