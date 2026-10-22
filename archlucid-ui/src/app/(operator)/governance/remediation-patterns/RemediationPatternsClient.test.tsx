import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const useRemediationPatternsQueryMock = vi.hoisted(() => vi.fn());
const useRemediationPatternDetailQueryMock = vi.hoisted(() => vi.fn());
const useOperateCapabilityMock = vi.hoisted(() => vi.fn(() => true));
const routerReplaceMock = vi.hoisted(() => vi.fn());
const importRemediationPatternYamlMock = vi.hoisted(() => vi.fn());
let searchParams = vi.hoisted(() => new URLSearchParams());

vi.mock("next/navigation", () => ({
  usePathname: () => "/security/remediation-patterns",
  useRouter: () => ({ replace: routerReplaceMock, push: vi.fn() }),
  useSearchParams: () => searchParams,
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

vi.mock("@/lib/remediation-pattern-api", () => ({
  importRemediationPatternYaml: (...args: unknown[]) => importRemediationPatternYamlMock(...args),
  submitRemediationPatternVersion: vi.fn(),
  approveRemediationPatternVersion: vi.fn(),
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

function mockListQuery(overrides: Record<string, unknown> = {}) {
  useRemediationPatternsQueryMock.mockReturnValue({
    data: [],
    isError: false,
    isLoading: false,
    isFetching: false,
    isSuccess: true,
    dataUpdatedAt: 0,
    refetch: vi.fn(),
    ...overrides,
  });
}

function mockDetailQuery(overrides: Record<string, unknown> = {}) {
  useRemediationPatternDetailQueryMock.mockReturnValue({
    data: null,
    isError: false,
    isLoading: false,
    isFetching: false,
    dataUpdatedAt: 0,
    refetch: vi.fn(),
    ...overrides,
  });
}

describe("RemediationPatternsClient", () => {
  beforeEach(() => {
    searchParams = new URLSearchParams();
    routerReplaceMock.mockClear();
  });

  it("clears selected pattern when registry filter hides the selected row", () => {
    const approvedPatternId = "11111111-1111-1111-1111-111111111111";

    searchParams = new URLSearchParams(
      `patternId=${approvedPatternId}&registryFilter=needs-attention`,
    );

    mockListQuery({
      data: [
        {
          patternId: approvedPatternId,
          patternKey: "storage.encrypt",
          displayName: "Encrypt storage",
          currentApprovedVersion: "1.0.0",
          createdByActorKey: "author",
          createdUtc: new Date().toISOString(),
          updatedUtc: new Date().toISOString(),
        },
        {
          patternId: "22222222-2222-2222-2222-222222222222",
          patternKey: "network.private",
          displayName: "Private endpoints",
          currentApprovedVersion: null,
          createdByActorKey: "author",
          createdUtc: new Date().toISOString(),
          updatedUtc: new Date().toISOString(),
        },
      ],
      dataUpdatedAt: Date.now(),
    });
    mockDetailQuery({ data: { succeeded: true, versions: [] }, dataUpdatedAt: Date.now() });

    render(<RemediationPatternsClient />);

    expect(screen.queryByTestId("remediation-pattern-detail-section")).not.toBeInTheDocument();
    expect(routerReplaceMock).toHaveBeenCalledWith("/security/remediation-patterns?registryFilter=needs-attention", {
      scroll: false,
    });
  });

  it("renders empty state when no patterns exist", () => {
    mockListQuery();
    mockDetailQuery();

    render(<RemediationPatternsClient />);

    expect(screen.getByTestId("remediation-patterns-empty")).toBeInTheDocument();
    expect(screen.getByTestId("remediation-patterns-draft-rule-copy")).toBeInTheDocument();
  });

  it("distinguishes loading from empty registry", () => {
    mockListQuery({ data: undefined, isLoading: true, isFetching: true, isSuccess: false });
    mockDetailQuery();

    render(<RemediationPatternsClient />);

    expect(screen.getByTestId("remediation-patterns-loading")).toBeInTheDocument();
    expect(screen.queryByTestId("remediation-patterns-empty")).not.toBeInTheDocument();
  });

  it("does not show empty copy while refetching without prior data", () => {
    mockListQuery({ data: undefined, isLoading: false, isFetching: true, isSuccess: false });
    mockDetailQuery();

    render(<RemediationPatternsClient />);

    expect(screen.getByTestId("remediation-patterns-loading")).toBeInTheDocument();
    expect(screen.queryByTestId("remediation-patterns-empty")).not.toBeInTheDocument();
  });

  it("renders the Remediation patterns nav icon in the page header", () => {
    mockListQuery();
    mockDetailQuery();

    render(<RemediationPatternsClient />);

    expect(screen.getByTestId("remediation-patterns-page-title")).toBeInTheDocument();
    expect(screen.getByTestId("remediation-patterns-header-import-button")).toBeInTheDocument();
  });

  it("renders list error state with recovery contract", () => {
    mockListQuery({ data: undefined, isError: true, isSuccess: false });
    mockDetailQuery();

    render(<RemediationPatternsClient />);

    expect(screen.getByTestId("remediation-patterns-list-error")).toBeInTheDocument();
    expect(screen.getByTestId("operator-error-recovery-contract")).toBeInTheDocument();
  });

  it("disables approve when author matches current actor (SoD)", () => {
    mockListQuery({
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
      dataUpdatedAt: Date.now(),
    });

    mockDetailQuery({
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
            contentJson: '{"controlObjective":"Encrypt data at rest"}',
            authorActorKey: "jwt:tenant:author-oid",
            createdUtc: new Date().toISOString(),
            updatedUtc: new Date().toISOString(),
          },
        ],
      },
      dataUpdatedAt: Date.now(),
    });

    render(<RemediationPatternsClient />);

    fireEvent.click(screen.getByTestId("remediation-pattern-row-storage.encrypt"));
    fireEvent.click(screen.getByRole("button", { name: "Mark content reviewed" }));

    const approveButton = screen.getByTestId("remediation-pattern-approve-button");
    expect(approveButton).toBeDisabled();
    expect(screen.getByTestId("remediation-pattern-approval-blocked-reason")).toHaveTextContent(
      "segregation of duties",
    );
  });

  it("blocks approve until pattern content is reviewed", () => {
    mockListQuery({
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
      dataUpdatedAt: Date.now(),
    });

    mockDetailQuery({
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
            contentJson: '{"controlObjective":"Encrypt data at rest"}',
            authorActorKey: "jwt:tenant:other-oid",
            createdUtc: new Date().toISOString(),
            updatedUtc: new Date().toISOString(),
          },
        ],
      },
      dataUpdatedAt: Date.now(),
    });

    render(<RemediationPatternsClient />);

    fireEvent.click(screen.getByTestId("remediation-pattern-row-storage.encrypt"));

    expect(screen.getByTestId("remediation-pattern-approve-button")).toBeDisabled();
    expect(screen.getByTestId("remediation-pattern-approval-blocked-reason")).toHaveTextContent(
      "Review the pattern content panel",
    );

    fireEvent.click(screen.getByRole("button", { name: "Mark content reviewed" }));

    expect(screen.getByTestId("remediation-pattern-approve-button")).toBeEnabled();
  });

  it("requires confirmation before approve", () => {
    mockListQuery({
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
      dataUpdatedAt: Date.now(),
    });

    mockDetailQuery({
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
            contentJson: "{}",
            authorActorKey: "jwt:tenant:other-oid",
            createdUtc: new Date().toISOString(),
            updatedUtc: new Date().toISOString(),
          },
        ],
      },
      dataUpdatedAt: Date.now(),
    });

    render(<RemediationPatternsClient />);

    fireEvent.click(screen.getByTestId("remediation-pattern-row-storage.encrypt"));
    fireEvent.click(screen.getByRole("button", { name: "Mark content reviewed" }));
    fireEvent.click(screen.getByTestId("remediation-pattern-approve-button"));

    expect(screen.getByTestId("remediation-pattern-approve-dialog")).toBeInTheDocument();
  });

  it("persists pattern selection in the URL", () => {
    mockListQuery({
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
      dataUpdatedAt: Date.now(),
    });
    mockDetailQuery({ data: { succeeded: true, versions: [] }, dataUpdatedAt: Date.now() });

    render(<RemediationPatternsClient />);

    fireEvent.click(screen.getByTestId("remediation-pattern-row-storage.encrypt"));

    expect(routerReplaceMock).toHaveBeenCalledWith(
      "/security/remediation-patterns?patternId=11111111-1111-1111-1111-111111111111",
      { scroll: false },
    );
  });

  it("opens import panel from header and disables import when YAML is empty", () => {
    mockListQuery();
    mockDetailQuery();

    render(<RemediationPatternsClient />);

    fireEvent.click(screen.getByTestId("remediation-patterns-header-import-button"));

    expect(screen.getByTestId("remediation-pattern-yaml-input")).toBeInTheDocument();
    expect(screen.getByTestId("remediation-pattern-import-button")).toBeDisabled();
    expect(screen.getByTestId("remediation-pattern-import-readiness")).toBeInTheDocument();
  });

  it("labels the YAML import field for assistive tech", () => {
    mockListQuery();
    mockDetailQuery();

    render(<RemediationPatternsClient />);

    fireEvent.click(screen.getByTestId("remediation-patterns-header-import-button"));

    expect(screen.getByLabelText("Remediation pattern YAML")).toHaveAttribute(
      "data-testid",
      "remediation-pattern-yaml-input",
    );
    expect(screen.getByLabelText("Remediation pattern YAML")).toHaveAttribute("spellcheck", "false");
  });

  it("selects imported draft in the URL after import", async () => {
    const listRefetch = vi.fn().mockResolvedValue(undefined);
    importRemediationPatternYamlMock.mockResolvedValue({
      succeeded: true,
      patternId: "11111111-1111-1111-1111-111111111111",
      version: "1.0.0",
    });

    mockListQuery({ refetch: listRefetch });
    mockDetailQuery();

    render(<RemediationPatternsClient />);

    fireEvent.click(screen.getByTestId("remediation-patterns-header-import-button"));
    fireEvent.change(screen.getByTestId("remediation-pattern-yaml-input"), {
      target: { value: "patternKey: storage.encrypt\nversion: 1.0.0" },
    });
    fireEvent.click(screen.getByTestId("remediation-pattern-import-button"));

    await waitFor(() => {
      expect(importRemediationPatternYamlMock).toHaveBeenCalled();
    });

    expect(routerReplaceMock).toHaveBeenCalledWith(
      "/security/remediation-patterns?patternId=11111111-1111-1111-1111-111111111111&version=1.0.0",
      { scroll: false },
    );
  });

  it("renders registry status and filter chips", () => {
    mockListQuery({
      data: [
        {
          patternId: "1",
          patternKey: "a",
          displayName: "A",
          currentApprovedVersion: null,
          createdByActorKey: "x",
          createdUtc: new Date().toISOString(),
          updatedUtc: new Date().toISOString(),
        },
      ],
      dataUpdatedAt: Date.now(),
    });
    mockDetailQuery();

    render(<RemediationPatternsClient />);

    expect(screen.getByTestId("remediation-pattern-registry-filter-chips")).toBeInTheDocument();
    expect(screen.getByText("No approved version")).toBeInTheDocument();
    expect(screen.getByText("Needs attention")).toBeInTheDocument();
  });
});
