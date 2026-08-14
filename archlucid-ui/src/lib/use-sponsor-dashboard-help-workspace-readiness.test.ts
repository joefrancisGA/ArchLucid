import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/hooks/use-pilot-roi-baseline-completeness", () => ({
  usePilotRoiBaselineCompleteness: vi.fn(),
}));

vi.mock("@/lib/active-workspace-scope-label", () => ({
  readActiveWorkspaceScopeLabel: () => "Claims Intake Demo",
}));

import { usePilotRoiBaselineCompleteness } from "@/hooks/use-pilot-roi-baseline-completeness";
import { useSponsorDashboardHelpWorkspaceReadiness } from "@/lib/use-sponsor-dashboard-help-workspace-readiness";

describe("useSponsorDashboardHelpWorkspaceReadiness", () => {
  it("maps complete baseline posture to ready status", async () => {
    vi.mocked(usePilotRoiBaselineCompleteness).mockReturnValue({
      loading: false,
      complete: true,
      reload: vi.fn(),
    });

    const { result } = renderHook(() => useSponsorDashboardHelpWorkspaceReadiness());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.workspaceScopeLabel).toBe("Claims Intake Demo");
    expect(result.current.baselineStatusLabel).toBe("Baseline anchors set");
    expect(result.current.baselineStatusKind).toBe("ready");
  });

  it("maps incomplete baseline posture to needs-attention status", async () => {
    vi.mocked(usePilotRoiBaselineCompleteness).mockReturnValue({
      loading: false,
      complete: false,
      reload: vi.fn(),
    });

    const { result } = renderHook(() => useSponsorDashboardHelpWorkspaceReadiness());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.baselineStatusLabel).toBe("Baseline anchors needed");
    expect(result.current.baselineStatusKind).toBe("needs-attention");
  });
});
