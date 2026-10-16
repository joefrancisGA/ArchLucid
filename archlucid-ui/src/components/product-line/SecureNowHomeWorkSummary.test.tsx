import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const assigned = vi.hoisted(() => ({
  state: {
    data: 4 as number | null | undefined,
    isPending: false,
    isError: false,
    error: null as Error | null,
  },
}));

vi.mock("@/hooks/use-assigned-to-me-findings-count-query", () => ({
  useAssignedToMeFindingsCountQuery: () => assigned.state,
}));

const api = vi.hoisted(() => ({
  fetchInfraEvidenceSnapshots: vi.fn(),
  fetchInfraEvidenceDiffsForSnapshot: vi.fn(),
  fetchRemediationFactorySummary: vi.fn(),
}));

vi.mock("@/lib/infra-evidence/infra-evidence-drift-api", () => ({
  fetchInfraEvidenceSnapshots: api.fetchInfraEvidenceSnapshots,
  fetchInfraEvidenceDiffsForSnapshot: api.fetchInfraEvidenceDiffsForSnapshot,
}));

vi.mock("@/lib/infra-evidence/infra-evidence-remediation-api", () => ({
  fetchRemediationFactorySummary: api.fetchRemediationFactorySummary,
}));

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { SecureNowHomeWorkSummary } from "./SecureNowHomeWorkSummary";

function renderSummary(): void {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <SecureNowHomeWorkSummary />
    </QueryClientProvider>,
  );
}

function factorySummary(overrides: {
  criticalExposureCount?: number | null;
  changeImplemented?: number;
  verificationFailed?: number;
  executed?: number;
} = {}) {
  return {
    factoryMetrics: {
      openFindings: 1,
      criticalExposureCount: overrides.criticalExposureCount === undefined ? 3 : overrides.criticalExposureCount,
      remediatedThisWeek: 0,
      verificationFailureCount: 0,
      businessBlockedCount: 0,
    },
    openInstancesByStatus: {
      ChangeImplemented: overrides.changeImplemented ?? 2,
      VerificationFailed: overrides.verificationFailed ?? 0,
      Executed: overrides.executed ?? 9,
    },
    waves: [],
  };
}

describe("SecureNowHomeWorkSummary", () => {
  it("renders four counted links in order", async () => {
    assigned.state = { data: 4, isPending: false, isError: false, error: null };
    api.fetchRemediationFactorySummary.mockResolvedValue(factorySummary());
    api.fetchInfraEvidenceSnapshots.mockResolvedValue({
      items: [{ snapshotId: "snap-1", capturedUtc: "2026-10-12T12:00:00.000Z" }],
      totalCount: 1,
      page: 1,
      pageSize: 20,
      hasMore: false,
    });
    api.fetchInfraEvidenceDiffsForSnapshot.mockResolvedValue([
      {
        diffId: "diff-1",
        snapshotAId: "a",
        snapshotBId: "snap-1",
        subscriptionId: null,
        totalChanges: 6,
        resourceAddedCount: 1,
        resourceRemovedCount: 0,
        resourceModifiedCount: 5,
        createdUtc: "2026-10-12T13:00:00.000Z",
      },
    ]);
    renderSummary();

    expect(await screen.findByText("3 with critical exposure")).toBeInTheDocument();
    expect(await screen.findByText("6 changes since the previous collection")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "My Findings" })).toHaveAttribute(
      "href",
      "/security/assigned-to-me",
    );

    const links = screen.getAllByRole("link").map((link) => link.textContent);

    expect(links).toEqual([
      "My Findings",
      "Highest-priority findings",
      "Recent changes",
      "Awaiting verification",
    ]);
    const assignedCount = screen.getByText("4 assigned to you");

    expect(assignedCount.className).toContain("text-[13px]");
    expect(assignedCount.className).toContain("font-medium");
    expect(assignedCount.className).toContain("tabular-nums");
    expect(OPERATOR_TYPOGRAPHY.dataValue).toContain("text-[13px]");
    expect(screen.getByText("2 waiting for a check")).toBeInTheDocument();
  });

  it("keeps a zero assigned count visible", async () => {
    assigned.state = { data: 0, isPending: false, isError: false, error: null };
    api.fetchRemediationFactorySummary.mockResolvedValue(factorySummary({ criticalExposureCount: 0, changeImplemented: 0 }));
    api.fetchInfraEvidenceSnapshots.mockResolvedValue({
      items: [],
      totalCount: 0,
      page: 1,
      pageSize: 20,
      hasMore: false,
    });
    renderSummary();

    expect(await screen.findByText("None assigned to you")).toBeInTheDocument();
  });

  it("appends failed checks without counting Executed as awaiting verification", async () => {
    assigned.state = { data: 1, isPending: false, isError: false, error: null };
    api.fetchRemediationFactorySummary.mockResolvedValue(
      factorySummary({ changeImplemented: 2, verificationFailed: 3, executed: 9 }),
    );
    api.fetchInfraEvidenceSnapshots.mockResolvedValue({
      items: [],
      totalCount: 0,
      page: 1,
      pageSize: 20,
      hasMore: false,
    });
    renderSummary();

    expect(await screen.findByText("2 waiting for a check · 3 checks failed")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Checks failed" })).toHaveAttribute(
      "href",
      "/security/remediation-instances?status=VerificationFailed",
    );
    expect(screen.getByText("3 verification failures")).toBeInTheDocument();
    expect(screen.queryByText(/11 waiting/)).not.toBeInTheDocument();
  });

  it("shows a factory failure on the priority and verification rows only", async () => {
    assigned.state = { data: 1, isPending: false, isError: false, error: null };
    api.fetchRemediationFactorySummary.mockRejectedValue(new Error("Factory summary unavailable"));
    api.fetchInfraEvidenceSnapshots.mockResolvedValue({
      items: [],
      totalCount: 0,
      page: 1,
      pageSize: 20,
      hasMore: false,
    });
    renderSummary();

    expect(await screen.findAllByText("Factory summary unavailable")).toHaveLength(2);
    expect(screen.getByRole("link", { name: "My Findings" })).toBeInTheDocument();
  });

  it("says there is no comparison when the newest snapshot has no diff", async () => {
    assigned.state = { data: 1, isPending: false, isError: false, error: null };
    api.fetchRemediationFactorySummary.mockResolvedValue(factorySummary());
    api.fetchInfraEvidenceSnapshots.mockResolvedValue({
      items: [{ snapshotId: "snap-1", capturedUtc: "2026-10-12T12:00:00.000Z" }],
      totalCount: 1,
      page: 1,
      pageSize: 20,
      hasMore: false,
    });
    api.fetchInfraEvidenceDiffsForSnapshot.mockResolvedValue([]);
    renderSummary();

    await waitFor(() => {
      expect(screen.getByRole("link", { name: "Recent changes" })).toHaveAttribute(
        "href",
        "/infrastructure/snapshots-drift",
      );
    });
    expect(await screen.findByText("No comparison yet")).toBeInTheDocument();
  });
});
