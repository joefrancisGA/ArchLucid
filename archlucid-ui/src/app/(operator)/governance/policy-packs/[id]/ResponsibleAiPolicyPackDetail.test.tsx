import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ResponsibleAiPolicyPackDetail } from "@/app/(operator)/governance/policy-packs/[id]/ResponsibleAiPolicyPackDetail";
import { BUNDLED_RESPONSIBLE_AI_POLICY_PACK_ID } from "@/lib/policy/policy-pack-detail-resolver";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

describe("ResponsibleAiPolicyPackDetail", () => {
  it("shows bundled default provenance (not Sample) when pack record is not yet loaded", () => {
    render(
      <ResponsibleAiPolicyPackDetail
        policyPackId={BUNDLED_RESPONSIBLE_AI_POLICY_PACK_ID}
        packRecord={null}
        packContent={null}
        isEnabled={false}
        isGloballyActive={false}
      />,
    );

    expect(screen.getByTestId("governance-policy-pack-breadcrumb")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Assign to workspace" })).toHaveAttribute(
      "href",
      `/governance/policy-packs?packId=${BUNDLED_RESPONSIBLE_AI_POLICY_PACK_ID}`,
    );
    expect(screen.getByRole("link", { name: "Start review with this pack" })).toHaveAttribute(
      "href",
      `/architecture/reviews/new?packId=${BUNDLED_RESPONSIBLE_AI_POLICY_PACK_ID}`,
    );
    expect(screen.getByRole("link", { name: "Open policy pack library" })).toHaveAttribute(
      "href",
      "/governance/policy-packs",
    );
    expect(screen.getByTestId("policy-pack-provenance-tag")).toHaveTextContent("Bundled default (platform)");
    expect(screen.queryByTestId("policy-pack-sample-tag")).not.toBeInTheDocument();
    expect(screen.queryByText("Sample policy pack")).not.toBeInTheDocument();
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
          packType: "PlatformDefault",
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
        isEnabled
        isGloballyActive
      />,
    );

    expect(screen.getByTestId("policy-pack-status-badge")).toHaveTextContent("Active");
    expect(screen.getByTestId("policy-pack-provenance-tag")).toHaveTextContent("Bundled default (platform)");
    expect(screen.getByText("Enabled")).toBeInTheDocument();
    expect(screen.getByText("Workspace")).toBeInTheDocument();
    expect(screen.getByText("Ai Gov 001")).toBeInTheDocument();
    expect(screen.getByTestId("policy-pack-rules-source-qualifier")).toHaveTextContent(
      "Published pack lists rule keys only; severity is not specified in pack metadata.",
    );
  });
});
