import { render, screen } from "@testing-library/react";
import type { PolicyPack } from "@/types/policy-packs";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/hooks/use-policy-pack-detail-page-query", () => ({
  usePolicyPackDetailPageQuery: () => ({
    isPending: false,
    isError: false,
    data: {
      packRecord: {
        policyPackId: "pack-1",
        tenantId: "t",
        workspaceId: "w",
        projectId: "p",
        name: "Pack 1",
        description: "",
        packType: "Custom",
        distributionScope: "Tenant",
        status: "Active",
        createdUtc: "2026-01-01T00:00:00.000Z",
        currentVersion: "1",
      } satisfies PolicyPack,
      packContent: null,
      workspaceSelection: [],
    },
    refetch: vi.fn(),
  }),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/compliance/policy-packs/pack-1",
  useRouter: () => ({ replace: vi.fn() }),
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
