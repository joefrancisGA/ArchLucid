import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/relative-time", () => ({
  formatRelativeTime: () => "2 hours ago",
}));

vi.mock("@/hooks/use-operator-scope-query-key", () => ({
  useOperatorScopeQueryKey: () => ({
    tenantId: "tenant-1",
    workspaceId: "ws-1",
    projectId: "prj-1",
  }),
}));

vi.mock("@/hooks/use-tenant-workspaces-list-query", () => ({
  useTenantWorkspacesListQuery: () => ({
    data: {
      workspaces: [
        {
          workspaceId: "ws-1",
          name: "Contoso workspace",
          projects: [{ projectId: "prj-1", name: "Payments" }],
        },
      ],
    },
    isPending: false,
    isError: false,
  }),
}));

const snapshots = vi.hoisted(() => ({
  fetchInfraEvidenceSnapshots: vi.fn(),
}));

vi.mock("@/lib/infra-evidence/infra-evidence-drift-api", () => ({
  fetchInfraEvidenceSnapshots: snapshots.fetchInfraEvidenceSnapshots,
}));

import { SecureNowHomeEnvironmentContext } from "./SecureNowHomeEnvironmentContext";

function renderContext(): void {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <SecureNowHomeEnvironmentContext />
    </QueryClientProvider>,
  );
}

function snapshot(overrides: Record<string, unknown> = {}) {
  return {
    snapshotId: "snap-1",
    subscriptionId: "sub-1",
    subscriptionName: "Production",
    capturedUtc: "2026-10-12T12:00:00.000Z",
    captureStatus: "Succeeded",
    resourceCount: 1,
    relationshipCount: 0,
    ...overrides,
  };
}

describe("SecureNowHomeEnvironmentContext", () => {
  it("renders workspace, one subscription, and collection time without a gap", async () => {
    snapshots.fetchInfraEvidenceSnapshots.mockResolvedValue({
      items: [snapshot()],
      totalCount: 1,
      page: 1,
      pageSize: 20,
      hasMore: false,
    });
    renderContext();

    expect(await screen.findByText("Contoso — Payments")).toBeInTheDocument();
    const subscription = screen.getByRole("link", { name: "Production" });

    expect(subscription).toHaveAttribute("href", "/integrations/cloud-connections");
    expect(screen.getByRole("link", { name: "2 hours ago" })).toHaveAttribute(
      "href",
      "/infrastructure/snapshots-drift",
    );
    expect(screen.queryByText("Inventory capture completed.")).not.toBeInTheDocument();
    expect(screen.queryByText("Inventory capture failed.")).not.toBeInTheDocument();
  });

  it("renders a subscription count when the first page has more than one", async () => {
    snapshots.fetchInfraEvidenceSnapshots.mockResolvedValue({
      items: [
        snapshot({ subscriptionName: "Production", subscriptionId: "sub-1" }),
        snapshot({
          snapshotId: "snap-2",
          subscriptionName: "Sandbox",
          subscriptionId: "sub-2",
          capturedUtc: "2026-10-11T12:00:00.000Z",
        }),
      ],
      totalCount: 2,
      page: 1,
      pageSize: 20,
      hasMore: false,
    });
    renderContext();

    const count = await screen.findByRole("link", { name: "2 subscriptions" });

    expect(count).toHaveAttribute("href", "/integrations/cloud-connections");
    expect(screen.queryByRole("link", { name: "Production" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Sandbox" })).not.toBeInTheDocument();
  });

  it("shows subscription name omission when only subscription id is stored", async () => {
    snapshots.fetchInfraEvidenceSnapshots.mockResolvedValue({
      items: [snapshot({ subscriptionName: "", subscriptionId: "0966098b-4d6c-4f09-af1b-965bc2a2ad1d" })],
      totalCount: 1,
      page: 1,
      pageSize: 20,
      hasMore: false,
    });
    renderContext();

    const link = await screen.findByRole("link", { name: "Subscription name was not stored." });

    expect(link).toHaveAttribute("href", "/integrations/cloud-connections");
  });

  it("links a failed capture to cloud connections with the blocked description", async () => {
    snapshots.fetchInfraEvidenceSnapshots.mockResolvedValue({
      items: [snapshot({ captureStatus: "Failed" })],
      totalCount: 1,
      page: 1,
      pageSize: 20,
      hasMore: false,
    });
    renderContext();

    const gap = await screen.findByRole("link", { name: "Inventory capture failed." });

    expect(gap).toHaveAttribute("href", "/integrations/cloud-connections");
  });

  it("links an empty snapshot list to cloud connections", async () => {
    snapshots.fetchInfraEvidenceSnapshots.mockResolvedValue({
      items: [],
      totalCount: 0,
      page: 1,
      pageSize: 20,
      hasMore: false,
    });
    renderContext();

    const empty = await screen.findByRole("link", { name: "No collection yet" });

    expect(empty).toHaveAttribute("href", "/integrations/cloud-connections");
    expect(screen.getByText("Contoso — Payments")).toBeInTheDocument();
  });
});
