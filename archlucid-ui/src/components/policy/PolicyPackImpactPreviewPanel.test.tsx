import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PolicyPackComplianceRuleKeyDiffView } from "@/components/policy/PolicyPackComplianceRuleKeyDiffView";
import { PolicyPackImpactPreviewPanel } from "@/components/policy/PolicyPackImpactPreviewPanel";

vi.mock("@/lib/api/policy-governance-api", () => ({
  simulatePolicyPackAgainstRun: vi.fn(),
}));

import { simulatePolicyPackAgainstRun } from "@/lib/api/policy-governance-api";

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
  it("runs baseline and stricter simulations and renders gate delta", async () => {
    vi.mocked(simulatePolicyPackAgainstRun)
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
      />,
    );

    fireEvent.change(screen.getByTestId("policy-impact-preview-run-id"), {
      target: { value: "run-abc" },
    });
    fireEvent.click(screen.getByTestId("policy-impact-preview-run"));

    await waitFor(() => {
      expect(screen.getByTestId("policy-impact-preview-gate-delta")).toBeInTheDocument();
    });

    expect(simulatePolicyPackAgainstRun).toHaveBeenCalledTimes(2);
    expect(screen.getByTestId("policy-impact-preview-gate-changed")).toBeInTheDocument();
    expect(screen.getByTestId("policy-pack-rule-key-diff-added")).toHaveTextContent("beta");
  });
});
