import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const useSearchParamsMock = vi.fn<() => URLSearchParams>();
const routerReplaceMock = vi.fn();

vi.mock("next/navigation", async (importOriginal) => {
  const { extendNextNavigationVitestMock } = await import("@/testing/next-navigation-vitest-mock");

  return extendNextNavigationVitestMock(importOriginal as () => Promise<typeof import("next/navigation")>, {
    useSearchParams: () => useSearchParamsMock(),
    useRouter: () =>
      ({
        back: vi.fn(),
        forward: vi.fn(),
        prefetch: vi.fn(),
        push: vi.fn(),
        refresh: vi.fn(),
        replace: routerReplaceMock,
        bfcacheId: null,
      }) as unknown as ReturnType<typeof import("next/navigation")["useRouter"]>,
    usePathname: () => "/internal/operational-errors",
  });
});

import { OperationalErrorsPageClient } from "./OperationalErrorsPageClient";
import type { OperationalErrorRow } from "./operational-errors-presentation";

const httpErrorRow: OperationalErrorRow = {
  id: "00000000-0000-0000-0000-000000000001",
  occurredUtc: "2026-08-28T00:00:00Z",
  source: "Api",
  category: "HttpError",
  httpStatusCode: 404,
  httpMethod: "GET",
  requestPath: "/v1/runs/missing",
  problemType: "NotFound",
  exceptionType: null,
  message: "Run not found",
  stackTrace: null,
  sqlErrorNumber: null,
  sqlErrorState: null,
  correlationId: "corr-http",
  otelTraceId: null,
  tenantId: "tenant-a",
  workspaceId: null,
  projectId: null,
  actorUserId: null,
  detailJson: "{}",
};

const databaseErrorRow: OperationalErrorRow = {
  ...httpErrorRow,
  id: "00000000-0000-0000-0000-000000000002",
  category: "DatabaseError",
  httpStatusCode: 500,
  message: "Sql timeout",
  correlationId: "corr-db",
  tenantId: "tenant-b",
};

describe("OperationalErrorsPageClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSearchParamsMock.mockReturnValue(new URLSearchParams());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("closes the detail panel when the selected row no longer matches active filters", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [httpErrorRow, databaseErrorRow],
      }),
    );

    render(<OperationalErrorsPageClient />);

    const messageButtons = await screen.findAllByRole("button", { name: "Run not found" });
    fireEvent.click(messageButtons[0]!);

    expect(await screen.findByText("Error detail")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("operational-errors-category-DatabaseError"));

    await waitFor(() => {
      expect(screen.queryByText("Error detail")).not.toBeInTheDocument();
    });
  });
});
