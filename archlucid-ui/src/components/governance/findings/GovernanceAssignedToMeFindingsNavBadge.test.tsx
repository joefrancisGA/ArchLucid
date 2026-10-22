import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { GovernanceAssignedToMeFindingsNavBadge } from "@/components/governance/findings/GovernanceAssignedToMeFindingsNavBadge";
import { OperatorQueryProvider } from "@/components/operator/OperatorQueryProvider";
import * as governanceApi from "@/lib/api/governance-stickiness-api";

vi.mock("@/lib/api/governance-stickiness-api", () => ({
  getArchitectureRiskRegister: vi.fn(),
}));

describe("GovernanceAssignedToMeFindingsNavBadge", () => {
  it("renders a count badge when assigned findings exist", async () => {
    vi.mocked(governanceApi.getArchitectureRiskRegister).mockResolvedValue({
      entries: [
        {
          findingId: "finding-a",
          title: "Assigned",
          severity: "High",
          category: "Security",
          statusLabel: "Open",
          agingDays: 1,
          isStale: false,
          evidenceHref: "/reviews/abc/findings/finding-a",
        },
      ],
    });

    render(
      <OperatorQueryProvider>
        <GovernanceAssignedToMeFindingsNavBadge />
      </OperatorQueryProvider>,
    );

    expect(await screen.findByTestId("governance-assigned-to-me-nav-badge")).toHaveTextContent("1");
  });

  it("renders nothing when the assigned count is zero", async () => {
    vi.mocked(governanceApi.getArchitectureRiskRegister).mockResolvedValue({ entries: [] });

    render(
      <OperatorQueryProvider>
        <GovernanceAssignedToMeFindingsNavBadge />
      </OperatorQueryProvider>,
    );

    expect(screen.queryByTestId("governance-assigned-to-me-nav-badge")).not.toBeInTheDocument();
  });
});
