import { act, cleanup, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  buyerPolishedShellVitestOverride,
  extendBuyerPolishedShellVitestMock,
} from "@/testing/buyer-polished-shell-vitest-override";
import { TENANT_MIGRATION_STATUS_POLL_MS } from "@/lib/tenant-migration-banner-copy";
import { fetchTenantCatalogMigrationStatus } from "@/lib/fetch-tenant-catalog-migration-status";
import { resetOperatorQueryClientForTests } from "@/lib/query/operator-query-client";
import { renderWithOperatorQuery } from "@/testing/render-with-operator-query";

vi.mock("@/lib/demo-ui-env", async (importOriginal) =>
  extendBuyerPolishedShellVitestMock(importOriginal),
);

vi.mock("@/lib/fetch-tenant-catalog-migration-status", () => ({
  fetchTenantCatalogMigrationStatus: vi.fn(),
}));

import { TenantMigrationMaintenanceBanner } from "./TenantMigrationMaintenanceBanner";

vi.mock("@/lib/demo-ui-env", () => ({
  isBuyerPolishedOperatorShellEnv: () => false,
  isNextPublicDemoMode: () => false,
}));

vi.mock("@/lib/operator/operator-static-demo", () => ({
  isStaticDemoPayloadFallbackEnabled: () => false,
}));

vi.mock("@/lib/query/operator-query-persist-client", () => ({
  setupOperatorQueryClientPersistence: () => {},
}));

const fetchStatusMock = vi.mocked(fetchTenantCatalogMigrationStatus);

describe("TenantMigrationMaintenanceBanner", () => {
  beforeEach(() => {
    sessionStorage.clear();
    resetOperatorQueryClientForTests();
    buyerPolishedShellVitestOverride.value = false;
    fetchStatusMock.mockReset();
  });

  afterEach(() => {
    cleanup();
    buyerPolishedShellVitestOverride.value = null;
    resetOperatorQueryClientForTests();
    vi.useRealTimers();
  });

  it("renders maintenance copy when migration is active", async () => {
    fetchStatusMock.mockResolvedValue({
      inMigration: true,
      message: "Writes frozen during catalog move.",
      stage: "ProjectionRefresh",
    });

    renderWithOperatorQuery(<TenantMigrationMaintenanceBanner />);

    await waitFor(() => {
      expect(screen.getByTestId("tenant-migration-maintenance-banner")).toBeInTheDocument();
    });

    expect(screen.getByText(/Writes frozen during catalog move/)).toBeInTheDocument();
    expect(screen.getByText(/Projection refresh/)).toBeInTheDocument();
  });

  it("uses stage suspend copy when the server omits a custom message", async () => {
    fetchStatusMock.mockResolvedValue({
      inMigration: true,
      stage: "ScopeFreeze",
    });

    renderWithOperatorQuery(<TenantMigrationMaintenanceBanner />);

    await waitFor(() => {
      expect(screen.getByTestId("tenant-migration-maintenance-banner")).toBeInTheDocument();
    });

    expect(screen.getByText(/new writes are suspended/i)).toBeInTheDocument();
  });

  it("stays hidden when migration is inactive", async () => {
    fetchStatusMock.mockResolvedValue({ inMigration: false });

    renderWithOperatorQuery(<TenantMigrationMaintenanceBanner />);

    await waitFor(() => {
      expect(fetchStatusMock).toHaveBeenCalled();
    });

    expect(screen.queryByTestId("tenant-migration-maintenance-banner")).not.toBeInTheDocument();
  });

  it("does not poll migration status when migration is inactive", async () => {
    fetchStatusMock.mockResolvedValue({ inMigration: false });

    vi.useFakeTimers({ shouldAdvanceTime: true });
    renderWithOperatorQuery(<TenantMigrationMaintenanceBanner />);

    await waitFor(() => {
      expect(fetchStatusMock).toHaveBeenCalledTimes(1);
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(TENANT_MIGRATION_STATUS_POLL_MS * 2);
    });

    expect(fetchStatusMock).toHaveBeenCalledTimes(1);
  });

  it("polls migration status and clears the banner when migration completes", async () => {
    fetchStatusMock
      .mockResolvedValueOnce({ inMigration: true, message: "Writes suspended." })
      .mockResolvedValueOnce({ inMigration: false });

    vi.useFakeTimers({ shouldAdvanceTime: true });
    renderWithOperatorQuery(<TenantMigrationMaintenanceBanner />);

    await waitFor(() => {
      expect(screen.getByTestId("tenant-migration-maintenance-banner")).toBeInTheDocument();
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(TENANT_MIGRATION_STATUS_POLL_MS);
    });

    await waitFor(() => {
      expect(screen.queryByTestId("tenant-migration-maintenance-banner")).not.toBeInTheDocument();
    });

    expect(fetchStatusMock).toHaveBeenCalledTimes(2);
  });

  it("keeps the banner visible when a later poll fails", async () => {
    fetchStatusMock
      .mockResolvedValueOnce({ inMigration: true, stage: "Verification" })
      .mockResolvedValueOnce(null);

    vi.useFakeTimers({ shouldAdvanceTime: true });
    renderWithOperatorQuery(<TenantMigrationMaintenanceBanner />);

    await waitFor(() => {
      expect(screen.getByTestId("tenant-migration-maintenance-banner")).toBeInTheDocument();
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(TENANT_MIGRATION_STATUS_POLL_MS);
    });

    await waitFor(() => {
      expect(fetchStatusMock).toHaveBeenCalledTimes(2);
    });

    expect(screen.getByTestId("tenant-migration-maintenance-banner")).toBeInTheDocument();
    expect(screen.getByText(/verification is running/i)).toBeInTheDocument();
    expect(screen.getByTestId("tenant-migration-status-refresh-failed")).toBeInTheDocument();
    expect(screen.getByText(/Could not refresh migration status/i)).toBeInTheDocument();
  });

  it("shows a degraded banner with retry when the first status poll fails", async () => {
    fetchStatusMock.mockImplementation(async () => null);

    renderWithOperatorQuery(<TenantMigrationMaintenanceBanner />);

    expect(await screen.findByText(/Catalog migration status unavailable/i)).toBeInTheDocument();
    expect(screen.getByTestId("tenant-migration-status-retry")).toBeInTheDocument();
  });

  it("shows correlation id and verification error details when provided", async () => {
    fetchStatusMock.mockResolvedValue({
      inMigration: true,
      stage: "Verification",
      correlationId: "corr-abc-123",
      migrationId: "11111111-2222-3333-4444-555555555555",
      lastVerificationError: "Committed review could not be loaded from the target catalog.",
    });

    renderWithOperatorQuery(<TenantMigrationMaintenanceBanner />);

    await waitFor(() => {
      expect(screen.getByTestId("tenant-migration-operator-details")).toBeInTheDocument();
    });

    expect(screen.getByText("corr-abc-123")).toBeInTheDocument();
    expect(screen.getByText(/could not be loaded/i)).toBeInTheDocument();
  });
});
