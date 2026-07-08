import { fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { isShowSystemAdministrationNavEnabled } from "@/lib/features";
import { renderWithOperatorQuery } from "@/testing/render-with-operator-query";

import { ResourceCoveragePageClient } from "./ResourceCoveragePageClient";

vi.mock("@/lib/features", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/features")>();

  return {
    ...actual,
    isShowSystemAdministrationNavEnabled: vi.fn(() => false),
  };
});

const mockIsShowSystemAdministrationNavEnabled = vi.mocked(isShowSystemAdministrationNavEnabled);

const originalFetch = globalThis.fetch;

function mockResourceCoverageFetch(rows: Array<{ resourceType: string; count: number }> = []) {
  globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

    if (url.includes("/api/proxy/v1/reports/resource-coverage")) {
      return new Response(JSON.stringify({ rows }), { status: 200 });
    }

    return new Response("not found", { status: 404 });
  }) as unknown as typeof fetch;
}

describe("ResourceCoveragePageClient", () => {
  beforeEach(() => {
    mockIsShowSystemAdministrationNavEnabled.mockReturnValue(false);
    mockResourceCoverageFetch([{ resourceType: "Microsoft.Compute/virtualMachines", count: 3 }]);
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.clearAllMocks();
  });

  it("does not expose REST routes in the default UI", async () => {
    renderWithOperatorQuery(<ResourceCoveragePageClient />);

    await waitFor(() => {
      expect(screen.getByText("Microsoft.Compute/virtualMachines")).toBeInTheDocument();
    });

    expect(screen.queryByText(/GET \/v1\//i)).not.toBeInTheDocument();
    expect(screen.queryByText(/\/api\//i)).not.toBeInTheDocument();
  });

  it("renders Refresh as a secondary outline button with last refreshed label", async () => {
    renderWithOperatorQuery(<ResourceCoveragePageClient />);

    const refreshButton = await screen.findByRole("button", { name: /^Refresh$/ });
    expect(refreshButton).toBeInTheDocument();
    expect(screen.getByTestId("resource-coverage-refresh-timestamp")).toHaveTextContent(/Last refreshed:/i);

    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledTimes(2);
    });
  });

  it("shows technical details with the diagnostics source when system administration nav is enabled", async () => {
    mockIsShowSystemAdministrationNavEnabled.mockReturnValue(true);

    renderWithOperatorQuery(<ResourceCoveragePageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("resource-coverage-technical-details")).toBeInTheDocument();
    });

    expect(screen.getByText("Diagnostics source")).toBeInTheDocument();
    expect(screen.getByText("GET /v1/reports/resource-coverage")).toBeInTheDocument();
  });
});
