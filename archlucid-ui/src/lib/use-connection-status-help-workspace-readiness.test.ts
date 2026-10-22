import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { fetchTenantIntegrationsOperations } from "@/lib/api";
import { ApiRequestError } from "@/lib/api-request-error";
import {
  resolveConnectionStatusHelpReadinessTileHref,
  useConnectionStatusHelpWorkspaceReadiness,
} from "@/lib/use-connection-status-help-workspace-readiness";

vi.mock("@/lib/api", () => ({
  fetchTenantIntegrationsOperations: vi.fn(),
}));

vi.mock("@/lib/active-workspace-scope-label", () => ({
  readActiveWorkspaceScopeLabel: () => "Claims Intake",
}));

describe("useConnectionStatusHelpWorkspaceReadiness", () => {
  beforeEach(() => {
    vi.mocked(fetchTenantIntegrationsOperations).mockReset();
  });

  it("uses server asOfUtc and workspace scope label on success", async () => {
    vi.mocked(fetchTenantIntegrationsOperations).mockResolvedValue({
      asOfUtc: "2026-07-10T12:00:00.000Z",
      connectors: [
        {
          connectorKey: "teams",
          displayName: "Microsoft Teams",
          isConfigured: true,
          smokeReadiness: "LocallyValid",
          summary: "",
          configurationHref: "/integrations/teams",
        },
      ],
      integrationEventBus: {
        publisherConfigured: false,
        transactionalOutboxEnabled: false,
        consumerConfigured: false,
        usesLegacyConnectionString: false,
        smokeReadiness: "NotConfigured",
      },
    });

    const { result } = renderHook(() => useConnectionStatusHelpWorkspaceReadiness());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.workspaceScopeLabel).toBe("Claims Intake");
    expect(result.current.loadedAtUtc).toBe("2026-07-10T12:00:00.000Z");
    expect(result.current.metrics).toHaveLength(5);
    expect(result.current.metrics.every((metric) => metric.href === null)).toBe(true);
  });

  it("marks loadForbidden on 403 errors", async () => {
    vi.mocked(fetchTenantIntegrationsOperations).mockRejectedValue(
      new ApiRequestError("Request failed (403 Forbidden)", {
        problem: null,
        correlationId: "corr-403",
        httpStatus: 403,
      }),
    );

    const { result } = renderHook(() => useConnectionStatusHelpWorkspaceReadiness());

    await waitFor(() => {
      expect(result.current.loadForbidden).toBe(true);
    });

    expect(result.current.loadFailed).toBe(false);
  });

  it("marks loadFailed on non-403 errors", async () => {
    vi.mocked(fetchTenantIntegrationsOperations).mockRejectedValue(
      new ApiRequestError("Request failed (500 Internal Server Error)", {
        problem: null,
        correlationId: "corr-500",
        httpStatus: 500,
      }),
    );

    const { result } = renderHook(() => useConnectionStatusHelpWorkspaceReadiness());

    await waitFor(() => {
      expect(result.current.loadFailed).toBe(true);
    });
  });
});

describe("resolveConnectionStatusHelpReadinessTileHref", () => {
  it("returns null until filtered inventory deep links exist", () => {
    expect(resolveConnectionStatusHelpReadinessTileHref("connected")).toBeNull();
    expect(resolveConnectionStatusHelpReadinessTileHref("background")).toBeNull();
  });
});
