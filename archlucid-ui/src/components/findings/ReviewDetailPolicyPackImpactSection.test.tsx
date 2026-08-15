import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ReviewDetailPolicyPackImpactSection } from "@/components/findings/ReviewDetailPolicyPackImpactSection";

vi.mock("@/lib/api", () => ({
  getArchitectureRequest: vi.fn(),
}));

import { getArchitectureRequest } from "@/lib/api";

describe("ReviewDetailPolicyPackImpactSection", () => {
  it("loads architecture request and surfaces cloud mismatch on the callout", async () => {
    vi.mocked(getArchitectureRequest).mockResolvedValue({
      cloudProvider: "AWS",
      policyReferences: ["demo-azure-security-pack"],
    } as Awaited<ReturnType<typeof getArchitectureRequest>>);

    render(
      <ReviewDetailPolicyPackImpactSection
        architectureRequestId="req-1"
        ruleSetId="healthcare-claims-v3"
        ruleSetVersion="3.4.1"
        runId="run-abc"
        mappedFindingCount={4}
        totalFindingCount={5}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("review-detail-policy-pack-cloud-mismatch")).toBeInTheDocument();
    });

    expect(getArchitectureRequest).toHaveBeenCalledWith("req-1");
    expect(screen.getByTestId("review-detail-policy-pack-cloud-mismatch")).toHaveTextContent("AWS");
  });
});
