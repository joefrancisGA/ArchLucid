import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

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

import { ExecutiveSqlBackupRegionVerificationCard } from "./ExecutiveSqlBackupRegionVerificationCard";

describe("ExecutiveSqlBackupRegionVerificationCard", () => {
  it("shows a green check and region name when verified", async () => {
    loadGate.verification = {
      ...loadGate.verification,
      verified: true,
      primaryDataRegion: "eastus",
    };

    render(<ExecutiveSqlBackupRegionVerificationCard />);

    expect(await screen.findByTestId("sql-backup-verification-status-verified")).toBeInTheDocument();
    expect(screen.getByTestId("sql-backup-verification-region-name")).toHaveTextContent("eastus");
  });

  it("shows a warning when unverified", async () => {
    loadGate.verification = {
      ...loadGate.verification,
      verified: false,
      primaryDataRegion: "westeurope",
      violations: [{ address: "azurerm_mssql_database.app", detail: "not in allowed" }],
    };

    render(<ExecutiveSqlBackupRegionVerificationCard />);

    await waitFor(() => {
      expect(screen.getByTestId("sql-backup-verification-status-unverified")).toBeInTheDocument();
    });
    expect(screen.getByTestId("sql-backup-verification-region-name")).toHaveTextContent("westeurope");
  });
});
