import type { ReactNode } from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAlertsInboxPageQuery } from "@/components/alerts/use-alerts-inbox-queries";
import { fetchAlertsInboxPage } from "@/components/alerts/alerts-inbox-query-fetch";
import type { AlertsInboxPageModel } from "@/app/(operator)/governance/alerts/_sections/alerts-inbox-page-model";
import { OPERATOR_QUERY_GC_MS, OPERATOR_QUERY_STALE_MS } from "@/lib/query/operator-query-stale-time";

vi.mock("@/components/alerts/alerts-inbox-query-fetch", () => ({
  fetchAlertsInboxPage: vi.fn(),
  fetchAlertsInboxSummary: vi.fn(),
  fetchAlertsInboxWorkspaceContext: vi.fn(),
}));

vi.mock("@/lib/operator/operator-scope-storage", () => ({
  ARCHLUCID_OPERATOR_SCOPE_CHANGED_EVENT: "archlucid:operator-scope-changed",
  getEffectiveBrowserProxyScopeHeaders: () => ({
    "x-tenant-id": "tenant-1",
    "x-workspace-id": "workspace-1",
    "x-project-id": "project-1",
  }),
}));

const fetchAlertsInboxPageMock = vi.mocked(fetchAlertsInboxPage);

function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: OPERATOR_QUERY_STALE_MS,
        gcTime: OPERATOR_QUERY_GC_MS,
        retry: false,
      },
    },
  });
}

describe("useAlertsInboxPageQuery SSR hydration (TB-2144)", () => {
  const initialModel: AlertsInboxPageModel = {
    status: "Open",
    page: 1,
    pageSize: 25,
    cursor: "",
    items: [],
    nextCursor: null,
    hasMore: false,
    loadFailure: null,
    buyerPolishedShell: false,
    usedDemoSample: false,
  };

  beforeEach(() => {
    fetchAlertsInboxPageMock.mockReset();
    fetchAlertsInboxPageMock.mockResolvedValue({
      items: [],
      nextCursor: null,
      hasMore: false,
      loadFailure: null,
    });
  });

  it("does not refetch on mount when SSR initialModel matches the active filter", async () => {
    const queryClient = createTestQueryClient();

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { unmount } = renderHook(
      () => useAlertsInboxPageQuery({ status: "Open", cursor: "", initialModel }),
      { wrapper },
    );

    await waitFor(() => {
      expect(fetchAlertsInboxPageMock).not.toHaveBeenCalled();
    });

    unmount();

    renderHook(() => useAlertsInboxPageQuery({ status: "Open", cursor: "", initialModel }), { wrapper });

    expect(fetchAlertsInboxPageMock).not.toHaveBeenCalled();
  });
});
