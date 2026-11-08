import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GovernanceAssignedToMeFindingsNavBadge } from "@/components/governance/findings/GovernanceAssignedToMeFindingsNavBadge";
import { getGovernanceAssignedToMeFindingsCount } from "@/lib/api/governance-stickiness-api-registers";
import { resetOperatorQueryClientForTests } from "@/lib/query/operator-query-client";
import { renderWithOperatorQuery } from "@/testing/render-with-operator-query";

import { useOperatorShellStatusConcernFetchEnabled } from "@/components/shell/OperatorShellStatusQueryGate";

vi.mock("@/components/shell/OperatorShellStatusQueryGate", () => ({
  OperatorShellStatusQueryGate: ({ children }: { children: React.ReactNode }) => children,
  useOperatorShellStatusConcernFetchEnabled: vi.fn(() => true),
}));

vi.mock("@/lib/api/governance-stickiness-api-registers", () => ({
  getGovernanceAssignedToMeFindingsCount: vi.fn(),
}));

vi.mock("@/lib/operator/operator-scope-storage", () => ({
  ARCHLUCID_OPERATOR_SCOPE_CHANGED_EVENT: "archlucid:operator-scope-changed",
  getEffectiveBrowserProxyScopeHeaders: () => ({
    "x-tenant-id": "tenant-1",
    "x-workspace-id": "workspace-1",
    "x-project-id": "project-1",
  }),
}));

const concernFetchEnabledMock = vi.mocked(useOperatorShellStatusConcernFetchEnabled);
const countMock = vi.mocked(getGovernanceAssignedToMeFindingsCount);

describe("GovernanceAssignedToMeFindingsNavBadge", () => {
  beforeEach(() => {
    resetOperatorQueryClientForTests();
    concernFetchEnabledMock.mockReturnValue(true);
    countMock.mockReset();
  });

  it("renders a count badge when assigned findings exist", async () => {
    countMock.mockResolvedValue({ count: 1 });

    const { unmount } = renderWithOperatorQuery(<GovernanceAssignedToMeFindingsNavBadge />);

    await waitFor(() => {
      expect(countMock).toHaveBeenCalledTimes(1);
    });

    expect(await screen.findByTestId("governance-assigned-to-me-nav-badge")).toHaveTextContent("1");
    unmount();
  });

  it("renders nothing when the assigned count is zero", async () => {
    countMock.mockResolvedValue({ count: 0 });

    const { container, unmount } = renderWithOperatorQuery(<GovernanceAssignedToMeFindingsNavBadge />);

    await waitFor(() => {
      expect(countMock).toHaveBeenCalledTimes(1);
    });

    expect(screen.queryByTestId("governance-assigned-to-me-nav-badge")).not.toBeInTheDocument();
    expect(container).toBeEmptyDOMElement();
    unmount();
  });
});
