import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const pathnameState = { value: "/infrastructure/ask" };

vi.mock("next/navigation", () => ({
  usePathname: () => pathnameState.value,
}));

vi.mock("@/components/WorkspaceModeProvider", () => ({
  useWorkspaceMode: () => ({ isWorkingMode: true, mode: "working", mounted: true }),
}));

vi.mock("@/components/shell/OperatorShellStatusQueryGate", () => ({
  useOperatorShellStatusConcernFetchEnabled: () => true,
}));

vi.mock("@/hooks/use-tenant-trial-status-query", () => ({
  useTenantTrialStatusQuery: () => ({
    data: {
      status: "Active",
      daysRemaining: 14,
      trialRunsUsed: 0,
      identityHandoffPending: false,
      trialSampleRunId: null,
    },
  }),
}));

vi.mock("@/lib/demo-ui-env", () => ({
  isBuyerPolishedOperatorShellEnv: () => false,
}));

vi.mock("@/components/product-line/ProductLineProvider", () => ({
  useProductLine: () => ({ productLine: "security" as const }),
}));

import { PersistentTrialStatusStrip } from "@/components/usability/PersistentTrialStatusStrip";

describe("PersistentTrialStatusStrip", () => {
  it("hides on Working infrastructure Ask so trial expiry banner is not duplicated", () => {
    pathnameState.value = "/infrastructure/ask";
    render(<PersistentTrialStatusStrip />);

    expect(screen.queryByTestId("persistent-trial-status-strip")).not.toBeInTheDocument();
  });

  it("still renders on other operator routes in Working mode", () => {
    pathnameState.value = "/infrastructure/resources";
    render(<PersistentTrialStatusStrip />);

    expect(screen.getByTestId("persistent-trial-status-strip")).toBeInTheDocument();
  });
});
