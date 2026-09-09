import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const useWorkspaceModeMock = vi.fn();
const useArchitectureInventoryBindingQueryMock = vi.fn();
const fetchInfraEvidenceSnapshotsMock = vi.fn();
const attachArchitectureInventoryBindingMock = vi.fn();
const detachArchitectureInventoryBindingMock = vi.fn();

vi.mock("@/components/WorkspaceModeProvider", () => ({
  useWorkspaceMode: () => useWorkspaceModeMock(),
}));

vi.mock("@/hooks/use-architecture-inventory-binding-query", () => ({
  useArchitectureInventoryBindingQuery: (...args: unknown[]) =>
    useArchitectureInventoryBindingQueryMock(...args),
}));

vi.mock("@/lib/infra-evidence/infra-evidence-drift-api", () => ({
  fetchInfraEvidenceSnapshots: (...args: unknown[]) => fetchInfraEvidenceSnapshotsMock(...args),
}));

vi.mock("@/lib/api/architecture-inventory-binding-api", () => ({
  attachArchitectureInventoryBinding: (...args: unknown[]) =>
    attachArchitectureInventoryBindingMock(...args),
  detachArchitectureInventoryBinding: (...args: unknown[]) =>
    detachArchitectureInventoryBindingMock(...args),
}));

import { ARCHITECTURE_INVENTORY_UNBOUND_ESTATE_GAP_LINE } from "@/lib/architecture/architecture-inventory-estate-gap-copy";
import { ArchitectureIdentityDeskInventoryBindingPanel } from "@/components/architecture/ArchitectureIdentityDeskInventoryBindingPanel";

const architectureId = "dddddddd-dddd-dddd-dddd-dddddddddddd";
const snapshotId = "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee";

function renderPanel(): ReturnType<typeof render> {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ArchitectureIdentityDeskInventoryBindingPanel architectureId={architectureId} />
    </QueryClientProvider>,
  );
}

describe("ArchitectureIdentityDeskInventoryBindingPanel (AS-049)", () => {
  beforeEach(() => {
    useWorkspaceModeMock.mockReturnValue({ isWorkingMode: true });
    fetchInfraEvidenceSnapshotsMock.mockResolvedValue({
      items: [
        {
          snapshotId,
          subscriptionId: "sub-1",
          subscriptionName: "Prod",
          capturedUtc: "2026-07-18T12:00:00.000Z",
          captureStatus: 1,
          resourceCount: 12,
          relationshipCount: 4,
        },
      ],
      totalCount: 1,
      page: 1,
      pageSize: 50,
      hasMore: false,
    });
    attachArchitectureInventoryBindingMock.mockResolvedValue({
      architectureId,
      isBound: true,
      snapshotId,
      snapshotSubscriptionName: "Prod",
      snapshotCapturedUtc: "2026-07-18T12:00:00.000Z",
    });
    detachArchitectureInventoryBindingMock.mockResolvedValue(undefined);
  });

  it("renders nothing outside Working mode", () => {
    useWorkspaceModeMock.mockReturnValue({ isWorkingMode: false });
    useArchitectureInventoryBindingQueryMock.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { architectureId, isBound: false },
      refetch: vi.fn(),
      blockedReason: null,
    });

    const { container } = renderPanel();

    expect(container).toBeEmptyDOMElement();
    expect(useArchitectureInventoryBindingQueryMock).toHaveBeenCalledWith(architectureId, false);
  });

  it("shows the unbound estate gap honesty line (AS-051)", async () => {
    useArchitectureInventoryBindingQueryMock.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { architectureId, isBound: false },
      refetch: vi.fn(),
      blockedReason: null,
    });

    renderPanel();

    expect(
      await screen.findByTestId("architecture-identity-desk-inventory-binding-estate-gap"),
    ).toHaveTextContent(ARCHITECTURE_INVENTORY_UNBOUND_ESTATE_GAP_LINE);
  });

  it("keeps attach disabled until a snapshot is selected (TB-2005)", async () => {
    useArchitectureInventoryBindingQueryMock.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { architectureId, isBound: false },
      refetch: vi.fn(),
      blockedReason: null,
    });

    renderPanel();

    await waitFor(() => {
      expect(screen.getByTestId("architecture-identity-desk-inventory-binding-picker")).toBeInTheDocument();
    });

    expect(screen.getByTestId("architecture-identity-desk-inventory-binding-attach")).toBeDisabled();
  });

  it("enables attach after selecting a snapshot and shows last saved after bind", async () => {
    useArchitectureInventoryBindingQueryMock.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { architectureId, isBound: false },
      refetch: vi.fn(),
      blockedReason: null,
    });

    renderPanel();

    const picker = await screen.findByTestId("architecture-identity-desk-inventory-binding-picker");

    await waitFor(() => {
      expect(picker).not.toBeDisabled();
    });

    fireEvent.change(picker, {
      target: { value: snapshotId },
    });

    const attachButton = screen.getByTestId("architecture-identity-desk-inventory-binding-attach");

    await waitFor(() => {
      expect(attachButton).toBeEnabled();
    });

    fireEvent.click(attachButton);

    await waitFor(() => {
      expect(attachArchitectureInventoryBindingMock).toHaveBeenCalledWith(architectureId, {
        snapshotId,
      });
    });

    await waitFor(() => {
      expect(
        screen.getByTestId("architecture-identity-desk-inventory-binding-save-status-last-saved"),
      ).toHaveTextContent(/^Last saved /);
    });
  });

  it("shows snapshot freshness for a recently bound snapshot (AS-052)", async () => {
    useArchitectureInventoryBindingQueryMock.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        architectureId,
        isBound: true,
        snapshotId,
        snapshotSubscriptionName: "Prod",
        snapshotCapturedUtc: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
      refetch: vi.fn(),
      blockedReason: null,
    });

    renderPanel();

    expect(screen.getByTestId("architecture-identity-desk-inventory-binding-freshness")).toHaveTextContent(
      "Snapshot age:",
    );
  });

  it("warns when the bound snapshot is stale (AS-052)", async () => {
    useArchitectureInventoryBindingQueryMock.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        architectureId,
        isBound: true,
        snapshotId,
        snapshotSubscriptionName: "Prod",
        snapshotCapturedUtc: "2026-01-01T12:00:00.000Z",
      },
      refetch: vi.fn(),
      blockedReason: null,
    });

    renderPanel();

    expect(screen.getByTestId("architecture-identity-desk-inventory-binding-freshness")).toHaveTextContent(
      "may not reflect current estate",
    );
  });

  it("shows bound snapshot metadata and detach control", async () => {
    useArchitectureInventoryBindingQueryMock.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        architectureId,
        isBound: true,
        snapshotId,
        snapshotSubscriptionName: "Prod",
        snapshotCapturedUtc: "2026-07-18T12:00:00.000Z",
      },
      refetch: vi.fn(),
      blockedReason: null,
    });

    renderPanel();

    expect(screen.getByTestId("architecture-identity-desk-inventory-binding-bound")).toHaveTextContent("Prod");
    expect(screen.getByTestId("architecture-identity-desk-inventory-binding-detach")).toBeInTheDocument();
    expect(screen.queryByTestId("architecture-identity-desk-inventory-binding-attach")).not.toBeInTheDocument();
  });
});
