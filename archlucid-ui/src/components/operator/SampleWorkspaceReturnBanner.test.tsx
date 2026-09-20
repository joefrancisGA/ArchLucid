import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const routerMock = vi.hoisted(() => ({
  replace: vi.fn(),
  refresh: vi.fn(),
}));

const sampleSessionMock = vi.hoisted(() => ({ isSample: true, visitActive: true }));

vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/hooks/use-effective-operator-scope", () => ({
  useIsSampleWorkspaceSession: () => sampleSessionMock.isSample,
}));

vi.mock("@/lib/operator/operator-sample-workspace-visit", () => ({
  isSampleWorkspaceVisitActive: () => sampleSessionMock.visitActive,
}));

const exitLiveSeatTrainingMock = vi.hoisted(() => vi.fn(async () => true));

vi.mock("@/lib/auth/exit-live-seat-training", () => ({
  exitLiveSeatTraining: (...args: unknown[]) => exitLiveSeatTrainingMock(...args),
}));

const setUserFirstSessionPurposeMock = vi.hoisted(() => vi.fn(async () => undefined));

vi.mock("@/lib/api/user-preferences", () => ({
  setUserFirstSessionPurpose: (...args: unknown[]) => setUserFirstSessionPurposeMock(...args),
}));

import { SampleWorkspaceReturnBanner } from "@/components/operator/SampleWorkspaceReturnBanner";
import { BUYER_SCOPE_BACK_TO_YOUR_WORKSPACE_CTA } from "@/lib/buyer/buyer-polish-copy";

describe("SampleWorkspaceReturnBanner", () => {
  beforeEach(() => {
    sampleSessionMock.isSample = true;
    sampleSessionMock.visitActive = true;
    exitLiveSeatTrainingMock.mockClear();
    exitLiveSeatTrainingMock.mockResolvedValue(true);
    routerMock.replace.mockClear();
    routerMock.refresh.mockClear();
  });

  it("shows_back_to_your_workspace_when_sample_visit_is_active", () => {
    render(<SampleWorkspaceReturnBanner />);

    expect(screen.getByTestId("sample-workspace-return-banner")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: BUYER_SCOPE_BACK_TO_YOUR_WORKSPACE_CTA })).toBeInTheDocument();
  });

  it("returns_to_dedicated_workspace_on_click", async () => {
    render(<SampleWorkspaceReturnBanner />);

    fireEvent.click(screen.getByRole("button", { name: BUYER_SCOPE_BACK_TO_YOUR_WORKSPACE_CTA }));

    await waitFor(() => {
      expect(exitLiveSeatTrainingMock).toHaveBeenCalledTimes(1);
      expect(routerMock.replace).toHaveBeenCalledWith("/");
      expect(routerMock.refresh).toHaveBeenCalledTimes(1);
    });
  });

  it("hides_when_sample_visit_is_not_active", () => {
    sampleSessionMock.visitActive = false;

    render(<SampleWorkspaceReturnBanner />);

    expect(screen.queryByTestId("sample-workspace-return-banner")).toBeNull();
  });
});
