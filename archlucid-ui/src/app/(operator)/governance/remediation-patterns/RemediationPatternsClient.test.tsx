import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const useRemediationPatternsQueryMock = vi.hoisted(() => vi.fn());
const useRemediationPatternDetailQueryMock = vi.hoisted(() => vi.fn());
const useOperateCapabilityMock = vi.hoisted(() => vi.fn(() => true));

vi.mock("@/hooks/use-remediation-patterns-query", () => ({
  useRemediationPatternsQuery: () => useRemediationPatternsQueryMock(),
  useRemediationPatternDetailQuery: () => useRemediationPatternDetailQueryMock(),
}));

vi.mock("@/hooks/use-operate-capability", () => ({
  useOperateCapability: () => useOperateCapabilityMock(),
}));

vi.mock("@/components/operator/OperatorNavAuthorityProvider", () => ({
  useOperatorNavAuthority: () => ({
    currentPrincipal: {
      provenance: "auth-me",
      name: "reviewer@example.com",
      roleClaimValues: [],
      primaryAppRole: null,
      maxAuthority: "ExecuteAuthority",
      authorityRank: 2,
      hasEnterpriseOperatorSurfaces: true,
      hasCommittedArchitectureReview: true,
      hasRecognizedArchLucidRole: true,
      permissionClaimValues: [],
      meClaims: [
        { type: "email", value: "reviewer@example.com" },
        { type: "oid", value: "author-oid" },
        { type: "tid", value: "tenant" },
      ],
    },
  }),
}));

import { RemediationPatternsClient } from "./RemediationPatternsClient";
import { REMEDIATION_PATTERN_STATUS } from "@/lib/remediation-pattern-status";

describe("RemediationPatternsClient", () => {
  it("renders empty state when no patterns exist", () => {
    useRemediationPatternsQueryMock.mockReturnValue({ data: [], isError: false });
    useRemediationPatternDetailQueryMock.mockReturnValue({ data: null, isError: false });

    render(<RemediationPatternsClient />);

    expect(screen.getByTestId("remediation-patterns-empty")).toBeInTheDocument();
  });

  it("renders list error state", () => {
    useRemediationPatternsQueryMock.mockReturnValue({ data: undefined, isError: true });
    useRemediationPatternDetailQueryMock.mockReturnValue({ data: null, isError: false });

    render(<RemediationPatternsClient />);

    expect(screen.getByTestId("remediation-patterns-list-error")).toBeInTheDocument();
  });

  it("disables approve when author matches current actor (SoD)", () => {
    useRemediationPatternsQueryMock.mockReturnValue({
      data: [
        {
          patternId: "11111111-1111-1111-1111-111111111111",
          patternKey: "storage.encrypt",
          displayName: "Encrypt storage",
          currentApprovedVersion: null,
          createdByActorKey: "author",
          createdUtc: new Date().toISOString(),
          updatedUtc: new Date().toISOString(),
        },
      ],
      isError: false,
      refetch: vi.fn(),
    });

    useRemediationPatternDetailQueryMock.mockReturnValue({
      data: {
        succeeded: true,
        versions: [
          {
            versionId: "22222222-2222-2222-2222-222222222222",
            patternId: "11111111-1111-1111-1111-111111111111",
            version: "1.0.0",
            status: REMEDIATION_PATTERN_STATUS.underReview,
            controlObjective: "Encrypt data at rest",
            authorActorKey: "jwt:tenant:author-oid",
            createdUtc: new Date().toISOString(),
            updatedUtc: new Date().toISOString(),
          },
        ],
      },
      isError: false,
      refetch: vi.fn(),
    });

    render(<RemediationPatternsClient />);

    fireEvent.click(screen.getByTestId("remediation-pattern-row-storage.encrypt"));

    const approveButton = screen.getByTestId("remediation-pattern-approve-button");
    expect(approveButton).toBeDisabled();
    expect(screen.getByTestId("remediation-pattern-approval-blocked-reason")).toHaveTextContent(
      "segregation of duties",
    );
  });
});
