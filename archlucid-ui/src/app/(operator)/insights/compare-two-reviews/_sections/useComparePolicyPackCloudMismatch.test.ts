import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { useComparePolicyPackCloudMismatch } from "@/app/(operator)/insights/compare-two-reviews/_sections/useComparePolicyPackCloudMismatch";
import { parseCompareManifestGovernanceSnapshot } from "@/lib/compare-effective-governance-diff";

vi.mock("@/lib/api", () => ({
  getArchitectureRequest: vi.fn(),
}));

import { getArchitectureRequest } from "@/lib/api";

describe("useComparePolicyPackCloudMismatch (TB-2322)", () => {
  it("evaluates mismatch per compared side from architecture requests", async () => {
    vi.mocked(getArchitectureRequest).mockImplementation(async (id: string) => {
      if (id === "req-baseline") {
        return {
          cloudProvider: "Aws",
          policyReferences: ["cis-azure"],
        } as Awaited<ReturnType<typeof getArchitectureRequest>>;
      }

      return {
        cloudProvider: "Gcp",
        policyReferences: ["cis-azure"],
      } as Awaited<ReturnType<typeof getArchitectureRequest>>;
    });

    const baselineManifest = parseCompareManifestGovernanceSnapshot({
      ruleSetId: "cis-azure",
      ruleSetVersion: "1.0.0",
    });
    const targetManifest = parseCompareManifestGovernanceSnapshot({
      ruleSetId: "aws-security",
      ruleSetVersion: "2.0.0",
    });

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children);

    const { result } = renderHook(
      () => useComparePolicyPackCloudMismatch("req-baseline", "req-target", baselineManifest, targetManifest),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.baselineDetail).toContain("AWS");
      expect(result.current.targetDetail).toContain("Google Cloud");
    });

    expect(getArchitectureRequest).toHaveBeenCalledWith("req-baseline");
    expect(getArchitectureRequest).toHaveBeenCalledWith("req-target");
  });
});
