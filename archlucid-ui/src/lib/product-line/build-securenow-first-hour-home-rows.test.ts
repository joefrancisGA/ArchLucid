import { describe, expect, it } from "vitest";

import { SECURENOW_INFRASTRUCTURE_DRIFT_PATH } from "@/lib/governance/governance-infrastructure-route-paths";
import { CLOUD_CONNECTIONS_PATH } from "@/lib/integrations-nav-paths";

import {
  SECURENOW_FIRST_HOUR_HOME_ROW_HREFS_WITHOUT_SNAPSHOT,
  buildSecureNowFirstHourHomeRows,
} from "./build-securenow-first-hour-home-rows";

describe("buildSecureNowFirstHourHomeRows", () => {
  it("starts on cloud connections when no snapshot exists", () => {
    const rows = buildSecureNowFirstHourHomeRows({ latestSnapshotId: null });
    const startRow = rows.find((row) => row.recommendedFirst === true);

    expect(startRow?.href).toBe(CLOUD_CONNECTIONS_PATH);
    expect(startRow?.label).toMatch(/Scope and freshness/i);
    expect(rows.map((row) => row.href)).toEqual(SECURENOW_FIRST_HOUR_HOME_ROW_HREFS_WITHOUT_SNAPSHOT);
  });

  it("starts on Changes and drift with snapshot id when a capture exists", () => {
    const rows = buildSecureNowFirstHourHomeRows({ latestSnapshotId: "snap-7" });
    const startRow = rows.find((row) => row.recommendedFirst === true);

    expect(startRow?.href).toBe(`${SECURENOW_INFRASTRUCTURE_DRIFT_PATH}?snapshotId=snap-7`);
    expect(startRow?.label).toMatch(/Changes and drift/i);
    expect(rows.filter((row) => row.recommendedFirst).length).toBe(1);
    expect(new Set(rows.map((row) => row.href)).size).toBe(5);
  });
});
