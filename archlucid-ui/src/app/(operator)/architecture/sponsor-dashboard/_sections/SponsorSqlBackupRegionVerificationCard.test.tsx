import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithOperatorQuery } from "@/testing/render-with-operator-query";
import { useOperatorQueryTestLifecycle } from "@/testing/operator-query-test-helpers";

const loadGate = vi.hoisted(() => ({
  verification: {
    schemaVersion: "1.0",
    kind: "archlucid.sqlBackupRegionVerification.v1",
    verified: true,
    generatedAtUtc: "2026-05-18T00:00:00Z",
    primaryDataRegion: "eastus",
    backupStorageRedundancy: "Geo",
    databaseResourceCount: 2,
    allowedBackupRedundancyModes: ["Geo", "Zone"],
    violations: [],
    missingExplicitRedundancy: [],
    source: {
      assertScript: "scripts/ci/assert_sql_backup_regions.py",
      planInput: "terraform show -json",
    },
  },
}));

vi.mock("@/lib/sql-backup-region-verification", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/sql-backup-region-verification")>();

  return {
    ...actual,
    fetchSqlBackupRegionVerification: vi.fn(async () => loadGate.verification),
  };
});

vi.mock("@/lib/query/operator-query-persist-client", () => ({
  setupOperatorQueryClientPersistence: () => {},
}));

import { SponsorSqlBackupRegionVerificationCard } from "./SponsorSqlBackupRegionVerificationCard";
import { fetchSqlBackupRegionVerification } from "@/lib/sql-backup-region-verification";

describe("SponsorSqlBackupRegionVerificationCard", () => {
  useOperatorQueryTestLifecycle();

  beforeEach(() => {
    vi.mocked(fetchSqlBackupRegionVerification).mockImplementation(async () => loadGate.verification);
  });

  it("shows buyer-safe loading copy aligned with the card title (TB-515)", () => {
    vi.mocked(fetchSqlBackupRegionVerification).mockReturnValue(new Promise(() => {}));

    renderWithOperatorQuery(<SponsorSqlBackupRegionVerificationCard />);

    expect(screen.getByTestId("sql-backup-verification-loading")).toHaveTextContent("Checking backup status…");
    expect(screen.getByTestId("sql-backup-verification-loading")).not.toHaveTextContent(/backup region verification/i);
  });

  it("shows a green check and region name when verified", async () => {
    loadGate.verification = {
      ...loadGate.verification,
      verified: true,
      primaryDataRegion: "eastus",
    };

    renderWithOperatorQuery(<SponsorSqlBackupRegionVerificationCard />);

    expect(await screen.findByTestId("sql-backup-verification-status-verified")).toBeInTheDocument();
    expect(screen.getByTestId("sql-backup-verification-region-name")).toHaveTextContent("eastus");
    expect(screen.getByTestId("sql-backup-verification-platform-scope-note")).toHaveTextContent(
      /ArchLucid platform infrastructure/i,
    );
    expect(screen.getByText(/verified against Terraform CI/i)).toBeInTheDocument();
  });

  it("shows a warning when unverified", async () => {
    loadGate.verification = {
      ...loadGate.verification,
      verified: false,
      primaryDataRegion: "westeurope",
      violations: [{ address: "azurerm_mssql_database.app", detail: "not in allowed" }],
    };

    renderWithOperatorQuery(<SponsorSqlBackupRegionVerificationCard />);

    await waitFor(() => {
      expect(screen.getByTestId("sql-backup-verification-status-unverified")).toBeInTheDocument();
    });
    expect(screen.getByTestId("sql-backup-verification-region-name")).toHaveTextContent("westeurope");
  });
});
