import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useGovernanceFindingsFilter } from "@/components/governance/findings/use-governance-findings-filter";

const searchParamsState = vi.hoisted(() => ({ query: "architectureId=customer-intake" }));
const replaceMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: replaceMock, back: vi.fn() }),
  usePathname: () => "/compliance/findings",
  useSearchParams: () => new URLSearchParams(searchParamsState.query),
}));

vi.mock("@/components/product-line/ProductLineProvider", () => ({
  useProductLine: () => ({ productLine: "security" }),
}));

vi.mock("@/lib/desk-continuity-preference", () => ({
  readCachedLastOpenArchitectureId: vi.fn(() => "customer-intake"),
}));

describe("useGovernanceFindingsFilter SecureNow findings queue", () => {
  beforeEach(() => {
    searchParamsState.query = "architectureId=customer-intake";
    replaceMock.mockClear();
  });

  it("ignores architecture scope and desk continuity on SecureNow findings", async () => {
    const { result } = renderHook(() => useGovernanceFindingsFilter({ mode: "tenant", isWorkingMode: true }));

    expect(result.current.scopedArchitectureId).toBeNull();
    expect(result.current.architectureScopeFilterActive).toBe(false);
    expect(result.current.lastOpenArchitectureId).toBeNull();

    await waitFor(() => {
      expect(replaceMock).not.toHaveBeenCalled();
    });
  });
});
