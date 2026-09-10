import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const useWorkspaceModeMock = vi.fn();
const useArchitectureSharesQueryMock = vi.fn();
const useLivelihoodDocumentGuardsMock = vi.fn();
const upsertArchitectureShareMock = vi.fn();
const setArchitectureRestrictToSharesMock = vi.fn();
const deleteArchitectureShareMock = vi.fn();

vi.mock("@/components/WorkspaceModeProvider", () => ({
  useWorkspaceMode: () => useWorkspaceModeMock(),
}));

vi.mock("@/hooks/use-architecture-shares-query", () => ({
  useArchitectureSharesQuery: (...args: unknown[]) => useArchitectureSharesQueryMock(...args),
}));

vi.mock("@/hooks/use-livelihood-document-guards", () => ({
  useLivelihoodDocumentGuards: (...args: unknown[]) => useLivelihoodDocumentGuardsMock(...args),
  LivelihoodDocumentGuardDialog: () => null,
}));

vi.mock("@/lib/api/architecture-share-api", () => ({
  upsertArchitectureShare: (...args: unknown[]) => upsertArchitectureShareMock(...args),
  setArchitectureRestrictToShares: (...args: unknown[]) => setArchitectureRestrictToSharesMock(...args),
  deleteArchitectureShare: (...args: unknown[]) => deleteArchitectureShareMock(...args),
}));

import { ArchitectureIdentityDeskSharePanel } from "@/components/architecture/ArchitectureIdentityDeskSharePanel";

const architectureId = "dddddddd-dddd-dddd-dddd-dddddddddddd";
const shareUserId = "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee";

function renderPanel(): ReturnType<typeof render> {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      users: [
        {
          userId: shareUserId,
          displayName: "Alex Operator",
          email: "alex@example.com",
          authorityLabel: "Operator",
        },
      ],
    }),
  }) as typeof fetch;

  return render(
    <QueryClientProvider client={queryClient}>
      <ArchitectureIdentityDeskSharePanel architectureId={architectureId} />
    </QueryClientProvider>,
  );
}

describe("ArchitectureIdentityDeskSharePanel (AS-092)", () => {
  beforeEach(() => {
    useWorkspaceModeMock.mockReturnValue({ isWorkingMode: true });
    useLivelihoodDocumentGuardsMock.mockReturnValue({
      dialogOpen: false,
      dialogMessage: "",
      confirmLeave: vi.fn(),
      cancelLeave: vi.fn(),
    });
    upsertArchitectureShareMock.mockResolvedValue(undefined);
    setArchitectureRestrictToSharesMock.mockResolvedValue({
      architectureId,
      restrictToShares: true,
    });
    deleteArchitectureShareMock.mockResolvedValue(undefined);
  });

  it("renders nothing outside Working mode", () => {
    useWorkspaceModeMock.mockReturnValue({ isWorkingMode: false });
    useArchitectureSharesQueryMock.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { architectureId, restrictToShares: false, shares: [] },
      refetch: vi.fn(),
      blockedReason: null,
    });

    const { container } = renderPanel();

    expect(container).toBeEmptyDOMElement();
    expect(useArchitectureSharesQueryMock).toHaveBeenCalledWith(architectureId, false);
  });

  it("keeps grant disabled until a person is selected (TB-2005)", async () => {
    useArchitectureSharesQueryMock.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { architectureId, restrictToShares: false, shares: [] },
      refetch: vi.fn(),
      blockedReason: null,
    });

    renderPanel();

    await waitFor(() => {
      expect(screen.getByTestId("architecture-identity-desk-share-user-picker")).toBeInTheDocument();
    });

    expect(screen.getByTestId("architecture-identity-desk-share-grant")).toBeDisabled();
  });

  it("enables livelihood guards when grant form is dirty", async () => {
    useArchitectureSharesQueryMock.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { architectureId, restrictToShares: false, shares: [] },
      refetch: vi.fn(),
      blockedReason: null,
    });

    renderPanel();

    const picker = await screen.findByTestId("architecture-identity-desk-share-user-picker");

    await waitFor(() => {
      expect(picker).not.toBeDisabled();
    });

    fireEvent.change(picker, { target: { value: shareUserId } });

    await waitFor(() => {
      expect(useLivelihoodDocumentGuardsMock).toHaveBeenCalledWith({ when: true });
    });
  });

  it("requires opt-in confirmation before saving restrict-to-shares", async () => {
    useArchitectureSharesQueryMock.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        architectureId,
        restrictToShares: false,
        shares: [],
        confirmationCopy: "Only people on the share list can see this architecture.",
      },
      refetch: vi.fn(),
      blockedReason: null,
    });

    renderPanel();

    fireEvent.click(screen.getByTestId("architecture-identity-desk-share-restrict-toggle"));

    expect(screen.getByTestId("architecture-identity-desk-share-save-restrict")).toBeDisabled();

    fireEvent.click(screen.getByTestId("architecture-identity-desk-share-confirm-opt-in"));

    await waitFor(() => {
      expect(screen.getByTestId("architecture-identity-desk-share-save-restrict")).toBeEnabled();
    });
  });

  it("states that the picker lists workspace users only (AS-096)", async () => {
    useArchitectureSharesQueryMock.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { architectureId, restrictToShares: false, shares: [] },
      refetch: vi.fn(),
      blockedReason: null,
    });

    renderPanel();

    await waitFor(() => {
      expect(screen.getByText(/picker lists workspace users only/i)).toBeInTheDocument();
    });
  });

  it("grants a share and shows last saved", async () => {
    useArchitectureSharesQueryMock.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { architectureId, restrictToShares: false, shares: [] },
      refetch: vi.fn(),
      blockedReason: null,
    });

    renderPanel();

    const picker = await screen.findByTestId("architecture-identity-desk-share-user-picker");

    await waitFor(() => {
      expect(picker).not.toBeDisabled();
    });

    fireEvent.change(picker, { target: { value: shareUserId } });

    fireEvent.click(screen.getByTestId("architecture-identity-desk-share-grant"));

    await waitFor(() => {
      expect(upsertArchitectureShareMock).toHaveBeenCalledWith(architectureId, shareUserId, { role: "View" });
    });

    await waitFor(() => {
      expect(screen.getByTestId("architecture-identity-desk-share-save-status-last-saved")).toHaveTextContent(
        /^Last saved /,
      );
    });
  });
});
