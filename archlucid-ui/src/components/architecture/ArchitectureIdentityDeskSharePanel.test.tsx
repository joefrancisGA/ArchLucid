import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const useWorkspaceModeMock = vi.fn();
const useArchitectureSharesQueryMock = vi.fn();
const putArchitectureShareMock = vi.fn();
const patchArchitectureRestrictToSharesMock = vi.fn();
const useLivelihoodDocumentGuardsMock = vi.fn();

vi.mock("@/components/WorkspaceModeProvider", () => ({
  useWorkspaceMode: () => useWorkspaceModeMock(),
}));

vi.mock("@/hooks/use-architecture-shares-query", () => ({
  useArchitectureSharesQuery: (...args: unknown[]) => useArchitectureSharesQueryMock(...args),
}));

vi.mock("@/lib/api/architecture-share-api", () => ({
  putArchitectureShare: (...args: unknown[]) => putArchitectureShareMock(...args),
  patchArchitectureRestrictToShares: (...args: unknown[]) => patchArchitectureRestrictToSharesMock(...args),
  revokeArchitectureShare: vi.fn(),
}));

vi.mock("@/hooks/use-livelihood-document-guards", () => ({
  useLivelihoodDocumentGuards: (...args: unknown[]) => useLivelihoodDocumentGuardsMock(...args),
}));

import { ArchitectureIdentityDeskSharePanel } from "@/components/architecture/ArchitectureIdentityDeskSharePanel";

const architectureId = "dddddddd-dddd-dddd-dddd-dddddddddddd";

function renderPanel(): ReturnType<typeof render> {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ArchitectureIdentityDeskSharePanel architectureId={architectureId} />
    </QueryClientProvider>,
  );
}

describe("ArchitectureIdentityDeskSharePanel", () => {
  beforeEach(() => {
    useWorkspaceModeMock.mockReturnValue({ isWorkingMode: true });
    useArchitectureSharesQueryMock.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        architectureId,
        restrictToShares: false,
        shares: [],
      },
      refetch: vi.fn(),
      blockedReason: null,
    });
    putArchitectureShareMock.mockResolvedValue({
      architectureId,
      restrictToShares: false,
      shares: [{ actorOid: "jwt:tenant:viewer", role: "View" }],
    });
    patchArchitectureRestrictToSharesMock.mockResolvedValue({
      architectureId,
      restrictToShares: true,
      shares: [{ actorOid: "jwt:tenant:admin", role: "Admin" }],
    });
  });

  it("wires livelihood document guards when the grant form is dirty", () => {
    renderPanel();

    fireEvent.change(screen.getByTestId("architecture-identity-desk-share-actor"), {
      target: { value: "jwt:tenant:viewer" },
    });

    expect(useLivelihoodDocumentGuardsMock).toHaveBeenCalledWith({ when: true });
  });

  it("requires confirm restrict before saving restrict-to-shares", async () => {
    renderPanel();

    fireEvent.click(screen.getByTestId("architecture-identity-desk-share-restrict-toggle"));
    fireEvent.click(screen.getByTestId("architecture-identity-desk-share-save-restrict"));

    expect(await screen.findByTestId("architecture-identity-desk-share-restrict-hint")).toBeInTheDocument();
    expect(patchArchitectureRestrictToSharesMock).not.toHaveBeenCalled();
  });

  it("grants a share when actor oid and role are provided", async () => {
    renderPanel();

    fireEvent.change(screen.getByTestId("architecture-identity-desk-share-actor"), {
      target: { value: "jwt:tenant:viewer" },
    });
    fireEvent.click(screen.getByTestId("architecture-identity-desk-share-grant"));

    await waitFor(() => {
      expect(putArchitectureShareMock).toHaveBeenCalledWith(architectureId, {
        actorOid: "jwt:tenant:viewer",
        role: "View",
      });
    });
  });
});
