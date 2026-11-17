import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ArchitectureDraftRegistryEntry } from "@/lib/architecture/architecture-draft-registry";

const useArchitectureDraftListQueryMock = vi.fn();

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
  };
});

vi.mock("@/hooks/useProductionDeskChrome", () => ({
  useProductionDeskChrome: () => false,
  useProductionEvalChrome: () => true,
}));

vi.mock("@/hooks/use-architecture-draft-list-query", () => ({
  useArchitectureDraftListQuery: () => useArchitectureDraftListQueryMock(),
  selectArchitectureDraftRegistryEntries: (query: { data?: readonly ArchitectureDraftRegistryEntry[] }) =>
    query.data ?? [],
}));

vi.mock("@/hooks/use-architecture-identities-list-query", () => ({
  useArchitectureIdentitiesListQuery: () => ({
    data: { items: [] },
    isFetched: true,
  }),
}));

vi.mock("@/hooks/use-operator-scope-record", () => ({
  useOperatorScopeRecord: () => ({
    workspaceId: "workspace-1",
    projectId: "project-1",
    tenantId: "tenant-1",
    workspaceLabel: "Default workspace",
    projectLabel: "Default project",
  }),
}));

vi.mock("@/components/WorkspaceModeProvider", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/WorkspaceModeProvider")>();
  const guidedWorkspace = {
    mode: "guided" as const,
    mounted: true,
    accountSyncState: "synced" as const,
    isWorkingMode: false,
    setAndPersist: vi.fn(),
  };

  return {
    ...actual,
    useWorkspaceMode: () => guidedWorkspace,
    useWorkspaceModeOrDefault: () => guidedWorkspace,
  };
});

import { ArchitectureDraftListClient } from "./ArchitectureDraftListClient";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/architecture/architectures",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/lib/api/draft-intake-api", () => ({
  getDraftRequest: vi.fn(),
  reopenDraftRequest: vi.fn(),
}));

function entry(
  overrides: Partial<ArchitectureDraftRegistryEntry> & Pick<ArchitectureDraftRegistryEntry, "draftId">,
): ArchitectureDraftRegistryEntry {
  return {
    draftId: overrides.draftId,
    displayName: overrides.displayName ?? "Healthcare Claims Platform",
    customerStatus: overrides.customerStatus ?? "ready-for-review",
    ownerLabel: overrides.ownerLabel ?? "You",
    lastUpdatedUtc: overrides.lastUpdatedUtc ?? "2026-07-12T23:42:05.000Z",
    linkedReviewId: overrides.linkedReviewId ?? null,
    serverUpdatedUtc: overrides.serverUpdatedUtc ?? overrides.lastUpdatedUtc ?? "2026-07-12T23:42:05.000Z",
  };
}

describe("ArchitectureDraftListClient buyer-polished shell", () => {
  beforeEach(() => {
    useArchitectureDraftListQueryMock.mockReset();
    useArchitectureDraftListQueryMock.mockReturnValue({
      data: [],
      isFetched: true,
      isError: false,
      failure: null,
      blockedReason: null,
    });
  });

  it("hides vocabulary rails and shows draft id disclosure", () => {
    useArchitectureDraftListQueryMock.mockReturnValue({
      data: [entry({ draftId: "draft-abc-123" })],
      isFetched: true,
      isError: false,
      failure: null,
      blockedReason: null,
    });

    render(<ArchitectureDraftListClient />);

    expect(screen.queryByTestId("projects-recycle-drafts-package-vocabulary")).not.toBeInTheDocument();
    expect(screen.queryByTestId("path-chooser-create-object-vocabulary")).not.toBeInTheDocument();
    expect(screen.getByTestId("architecture-draft-id-draft-abc-123")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Show details" })).toBeInTheDocument();
  });
});
