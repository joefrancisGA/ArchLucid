import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const useRemediationPatternsQueryMock = vi.hoisted(() => vi.fn());
const useRemediationPatternDetailQueryMock = vi.hoisted(() => vi.fn());
const useOperateCapabilityMock = vi.hoisted(() => vi.fn(() => true));
const routerReplaceMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  usePathname: () => "/security/remediation-patterns",
  useRouter: () => ({ replace: routerReplaceMock }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/components/product-line/ProductLineProvider", () => ({
  useProductLine: () => ({ productLine: "security" }),
}));

vi.mock("@/hooks/use-remediation-patterns-query", () => ({
  useRemediationPatternsQuery: () => useRemediationPatternsQueryMock(),
  useRemediationPatternDetailQuery: () => useRemediationPatternDetailQueryMock(),
}));

vi.mock("@/hooks/use-operate-capability", () => ({
  useOperateCapability: () => useOperateCapabilityMock(),
}));

vi.mock("@/hooks/use-operator-relative-freshness-now-ms", () => ({
  useOperatorRelativeFreshnessNowMs: () => Date.now(),
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
    useRemediationPatternsQueryMock.mockReturnValue({ data: [], isError: false, isLoading: false, isFetching: false, dataUpdatedAt: 0, refetch: vi.fn() });
    useRemediationPatternDetailQueryMock.mockReturnValue({ data: null, isError: false, isLoading: false, isFetching: false, dataUpdatedAt: 0, refetch: vi.fn() });

    render(<RemediationPatternsClient />);

    expect(screen.getByTestId("remediation-patterns-empty")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Import YAML" })).toHaveAttribute(
      "href",
      "/security/remediation-patterns#remediation-pattern-yaml-import",
    );
  });

  it("distinguishes loading from empty registry", () => {
    useRemediationPatternsQueryMock.mockReturnValue({ data: undefined, isError: false, isLoading: true, isFetching: true, dataUpdatedAt: 0, refetch: vi.fn() });
    useRemediationPatternDetailQueryMock.mockReturnValue({ data: null, isError: false, isLoading: false, isFetching: false, dataUpdatedAt: 0, refetch: vi.fn() });

    render(<RemediationPatternsClient />);

    expect(screen.getByTestId("remediation-patterns-loading")).toBeInTheDocument();
    expect(screen.queryByTestId("remediation-patterns-empty")).not.toBeInTheDocument();
  });

  it("renders the Remediation patterns nav icon in the page header", () => {
    useRemediationPatternsQueryMock.mockReturnValue({ data: [], isError: false, isLoading: false, isFetching: false, dataUpdatedAt: 0, refetch: vi.fn() });
    useRemediationPatternDetailQueryMock.mockReturnValue({ data: null, isError: false, isLoading: false, isFetching: false, dataUpdatedAt: 0, refetch: vi.fn() });

    render(<RemediationPatternsClient />);

    expect(screen.getByTestId("remediation-patterns-page-title")).toBeInTheDocument();
  });

  it("renders list error state", () => {
    useRemediationPatternsQueryMock.mockReturnValue({ data: undefined, isError: true, isLoading: false, isFetching: false, dataUpdatedAt: 0, refetch: vi.fn() });
    useRemediationPatternDetailQueryMock.mockReturnValue({ data: null, isError: false, isLoading: false, isFetching: false, dataUpdatedAt: 0, refetch: vi.fn() });

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
      isLoading: false,
      isFetching: false,
      dataUpdatedAt: Date.now(),
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
            automationLevel: "Guided",
            authorActorKey: "jwt:tenant:author-oid",
            createdUtc: new Date().toISOString(),
            updatedUtc: new Date().toISOString(),
          },
        ],
      },
      isError: false,
      isLoading: false,
      isFetching: false,
      dataUpdatedAt: Date.now(),
      refetch: vi.fn(),
    });

    render(<RemediationPatternsClient />);

    fireEvent.click(screen.getByTestId("remediation-pattern-row-storage.encrypt"));

    expect(screen.getByTestId("remediation-pattern-version-review-fields")).toHaveTextContent("Encrypt data at rest");
    expect(screen.getByTestId("remediation-pattern-version-review-fields")).toHaveTextContent("Guided");

    const approveButton = screen.getByTestId("remediation-pattern-approve-button");
    expect(approveButton).toBeDisabled();
    expect(screen.getByTestId("remediation-pattern-approval-blocked-reason")).toHaveTextContent(
      "segregation of duties",
    );
  });

  it("requires confirmation before approve", () => {
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
      isLoading: false,
      isFetching: false,
      dataUpdatedAt: Date.now(),
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
            automationLevel: "Automated",
            authorActorKey: "jwt:tenant:other-oid",
            createdUtc: new Date().toISOString(),
            updatedUtc: new Date().toISOString(),
          },
        ],
      },
      isError: false,
      isLoading: false,
      isFetching: false,
      dataUpdatedAt: Date.now(),
      refetch: vi.fn(),
    });

    render(<RemediationPatternsClient />);

    fireEvent.click(screen.getByTestId("remediation-pattern-row-storage.encrypt"));
    fireEvent.click(screen.getByTestId("remediation-pattern-approve-button"));

    expect(screen.getByTestId("remediation-pattern-approve-dialog")).toBeInTheDocument();
  });

  it("persists pattern selection in the URL", () => {
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
      isLoading: false,
      isFetching: false,
      dataUpdatedAt: Date.now(),
      refetch: vi.fn(),
    });

    useRemediationPatternDetailQueryMock.mockReturnValue({
      data: { succeeded: true, versions: [] },
      isError: false,
      isLoading: false,
      isFetching: false,
      dataUpdatedAt: Date.now(),
      refetch: vi.fn(),
    });

    render(<RemediationPatternsClient />);

    fireEvent.click(screen.getByTestId("remediation-pattern-row-storage.encrypt"));

    expect(routerReplaceMock).toHaveBeenCalledWith(
      "/security/remediation-patterns?patternId=11111111-1111-1111-1111-111111111111",
      { scroll: false },
    );
  });

  it("labels the YAML import field for assistive tech", () => {
    useRemediationPatternsQueryMock.mockReturnValue({ data: [], isError: false, isLoading: false, isFetching: false, dataUpdatedAt: 0, refetch: vi.fn() });
    useRemediationPatternDetailQueryMock.mockReturnValue({ data: null, isError: false, isLoading: false, isFetching: false, dataUpdatedAt: 0, refetch: vi.fn() });

    render(<RemediationPatternsClient />);

    expect(screen.getByLabelText("Remediation pattern YAML")).toHaveAttribute(
      "data-testid",
      "remediation-pattern-yaml-input",
    );
  });
});
