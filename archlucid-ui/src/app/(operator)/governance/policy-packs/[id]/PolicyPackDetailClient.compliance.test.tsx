import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/hooks/use-policy-pack-detail-page-query", () => ({
  usePolicyPackDetailPageQuery: () => ({
    isPending: false,
    isError: false,
    data: {
      packRecord: {
        policyPackId: "pack-1",
        displayName: "Pack 1",
        description: null,
        version: "1",
        isActive: true,
      },
      packContent: null,
      workspaceSelection: [],
    },
    refetch: vi.fn(),
  }),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/compliance/policy-packs/pack-1",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/components/product-line/ProductLineProvider", () => ({
  useProductLine: () => ({ productLine: "security" }),
}));

import { PolicyPackDetailClient } from "./PolicyPackDetailClient";

describe("PolicyPackDetailClient SecureNow compliance (COD)", () => {
  it("renders compliance wayfinding and skip-target main", () => {
    render(<PolicyPackDetailClient policyPackId="pack-1" />);

    expect(screen.getByTestId("compliance-policy-pack-detail-wayfinding")).toHaveTextContent("Policy packs hub");
    expect(screen.getByTestId("policy-pack-detail-primary-content")).toHaveAttribute("tabIndex", "-1");
  });
});