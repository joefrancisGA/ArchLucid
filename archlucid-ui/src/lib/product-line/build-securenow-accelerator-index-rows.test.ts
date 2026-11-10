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
});
