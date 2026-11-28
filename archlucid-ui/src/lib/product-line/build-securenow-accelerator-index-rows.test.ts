import { describe, expect, it } from "vitest";

import { SECURENOW_INFRASTRUCTURE_DRIFT_PATH, SECURENOW_INFRASTRUCTURE_EXTRACT_UPLOAD_PATH } from "@/lib/governance/governance-infrastructure-route-paths";

import { buildSecureNowAcceleratorIndexRows } from "./build-securenow-accelerator-index-rows";

describe("buildSecureNowAcceleratorIndexRows", () => {
  it("starts on Manual upload when no snapshot exists", () => {
    const rows = buildSecureNowAcceleratorIndexRows({ latestSnapshotId: null });
    const startRow = rows.find((row) => row.recommendedFirst === true);

    expect(startRow?.href).toBe(SECURENOW_INFRASTRUCTURE_EXTRACT_UPLOAD_PATH);
    expect(startRow?.label).toMatch(/Manual upload/i);
  });

  it("starts on Changes and drift with snapshot id when a capture exists", () => {
    const rows = buildSecureNowAcceleratorIndexRows({ latestSnapshotId: "snap-7" });
    const startRow = rows.find((row) => row.recommendedFirst === true);

    expect(startRow?.href).toBe(`${SECURENOW_INFRASTRUCTURE_DRIFT_PATH}?snapshotId=snap-7`);
    expect(startRow?.label).toMatch(/Changes and drift/i);
    expect(rows.find((row) => row.label.includes("Pilot walkthrough"))?.recommendedFirst).toBe(false);
  });

  it("deep-links the scenario index and vault fixture to their distinct walks", () => {
    const rows = buildSecureNowAcceleratorIndexRows({ latestSnapshotId: null });
    const scenarioPath = "/administration/securenow-scenario-walks";

    expect(rows.find((row) => row.label === "Scenario walks")?.href).toBe(
      `${scenarioPath}#fixture-path-02`,
    );
    expect(rows.find((row) => row.label.includes("fixture-path-03"))?.href).toBe(
      `${scenarioPath}#fixture-path-03`,
    );
    expect(rows.find((row) => row.label === "Scenario walks")?.summary).toMatch(/fixture-path-02/i);
  });
});
