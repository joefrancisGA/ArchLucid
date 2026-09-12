import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PolicyPackComplianceRuleKeyDiffView } from "@/components/policy/PolicyPackComplianceRuleKeyDiffView";
import { PolicyPackImpactPreviewPanel } from "@/components/policy/PolicyPackImpactPreviewPanel";

vi.mock("@/lib/api/policy-governance-api", () => ({
  simulatePolicyPackAgainstRun: vi.fn(),
}));

const replaceMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
}));

vi.mock("@/hooks/use-policy-pack-versions-query", () => ({
  usePolicyPackVersionsQuery: vi.fn((packId: string) => ({
    data:
      packId === "00000000-0000-0000-0000-000000000001"
        ? [
            {
              policyPackVersionId: "v1",
              version: "1.0.0",
              isPublished: true,
              contentJson: JSON.stringify({ complianceRuleKeys: ["beta"] }),
            },
          ]
        : packId === "00000000-0000-0000-0000-000000000002"
          ? [
              {
                policyPackVersionId: "v2",
                version: "2.0.0",
                isPublished: true,
                contentJson: JSON.stringify({ complianceRuleKeys: ["gamma"] }),
              },
            ]
          : [],
  })),
}));

import { simulatePolicyPackAgainstRun } from "@/lib/api/policy-governance-api";

const samplePacks = [
  {
    policyPackId: "00000000-0000-0000-0000-000000000001",
    tenantId: "tenant",
    workspaceId: "workspace",
    projectId: "project",
    name: "Pack Alpha",
    description: "",
    packType: "Custom",
    distributionScope: "Tenant",
    status: "Active",
    createdUtc: "2026-01-01T00:00:00Z",
    currentVersion: "1.0.0",
  },
  {
    policyPackId: "00000000-0000-0000-0000-000000000002",
    tenantId: "tenant",
    workspaceId: "workspace",
    projectId: "project",
    name: "Pack Beta",
    description: "",
    packType: "Custom",
    distributionScope: "Tenant",
    status: "Active",
    createdUtc: "2026-01-01T00:00:00Z",
    currentVersion: "2.0.0",
  },
] as const;

describe("PolicyPackComplianceRuleKeyDiffView", () => {
  it("renders added and removed compliance rule keys", () => {
    render(
      <PolicyPackComplianceRuleKeyDiffView
        beforeKeys={["alpha"]}
        afterKeys={["alpha", "beta"]}
      />,
    );

    expect(screen.getByTestId("policy-pack-rule-key-diff-added")).toHaveTextContent("beta");
    expect(screen.queryByTestId("policy-pack-rule-key-diff-removed")).toBeNull();
  });
});

describe("PolicyPackImpactPreviewPanel", () => {
  it("syncs pack comparison ids to the policy packs URL when selects change", () => {
    replaceMock.mockClear();

    render(
      <PolicyPackImpactPreviewPanel
        effectiveContent={{ complianceRuleKeys: ["alpha"] }}
        selectedPackId="00000000-0000-0000-0000-000000000001"
        packVersions={[]}
        packs={samplePacks}
        scopedReviewId="run-abc"
        initialPackAId="00000000-0000-0000-0000-000000000001"
        initialPackBId="00000000-0000-0000-0000-000000000002"
      />,
    );

    fireEvent.change(screen.getByTestId("policy-impact-preview-pack-a"), {
      target: { value: "00000000-0000-0000-0000-000000000002" },
    });

    expect(replaceMock).toHaveBeenCalledWith(
      "/governance/policy-packs?reviewId=run-abc&packAId=00000000-0000-0000-0000-000000000002&packBId=00000000-0000-0000-0000-000000000002",
      { scroll: false },
    );
  });

  it("runs baseline and stricter simulations and renders gate delta", async () => {
    vi.mocked(simulatePolicyPackAgainstRun)
      .mockResolvedValueOnce({
        gateResult: { blocked: false, warnOnly: false },
        failedChecks: [],
      })
      .mockResolvedValueOnce({
        gateResult: { blocked: true, warnOnly: false },
        failedChecks: ["critical-finding"],
      })
      .mockResolvedValueOnce({
        gateResult: { blocked: false, warnOnly: false },
        failedChecks: [],
      })
      .mockResolvedValueOnce({
        gateResult: { blocked: true, warnOnly: false },
        failedChecks: ["critical-finding"],
      });

    render(
      <PolicyPackImpactPreviewPanel
        effectiveContent={{ complianceRuleKeys: ["alpha"] }}
        selectedPackId="00000000-0000-0000-0000-000000000001"
        packVersions={[
          {
            policyPackVersionId: "v1",
            version: "1.0.0",
            isPublished: true,
            contentJson: JSON.stringify({ complianceRuleKeys: ["beta"] }),
          },
        ]}
        packs={samplePacks}
        scopedReviewId="run-abc"
      />,
    );

    fireEvent.click(screen.getByTestId("policy-impact-preview-run"));

    await waitFor(() => {
      expect(screen.getByTestId("policy-impact-preview-gate-delta")).toBeInTheDocument();
    });

    expect(simulatePolicyPackAgainstRun).toHaveBeenCalledTimes(4);
    expect(screen.getByTestId("policy-impact-preview-gate-changed")).toBeInTheDocument();
    expect(screen.getAllByTestId("policy-pack-rule-key-diff-added")[0]).toHaveTextContent("beta");
    expect(screen.getByTestId("policy-impact-preview-pack-gate-delta")).toBeInTheDocument();
    expect(screen.getByTestId("policy-impact-preview-pack-gate-changed")).toBeInTheDocument();
  });
});
