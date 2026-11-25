import { describe, expect, it } from "vitest";

import {
  GOVERNANCE_INFRASTRUCTURE_DRIFT_PATH,
  SECURENOW_INFRASTRUCTURE_DRIFT_LEGACY_PATH,
  SECURENOW_INFRASTRUCTURE_DRIFT_PATH,
} from "@/lib/governance/governance-infrastructure-route-paths";

import { driftWorkbenchNavHrefForPath, isDriftWorkbenchRoutePath } from "./drift-workbench-route";

describe("drift-workbench-route", () => {
  it("recognizes drift workbench route paths", () => {
    expect(isDriftWorkbenchRoutePath(GOVERNANCE_INFRASTRUCTURE_DRIFT_PATH)).toBe(true);
    expect(isDriftWorkbenchRoutePath(SECURENOW_INFRASTRUCTURE_DRIFT_PATH)).toBe(true);
    expect(isDriftWorkbenchRoutePath(SECURENOW_INFRASTRUCTURE_DRIFT_LEGACY_PATH)).toBe(true);
    expect(isDriftWorkbenchRoutePath("/infrastructure/resources")).toBe(false);
  });

  it("preserves pathname namespace for nav href", () => {
    expect(driftWorkbenchNavHrefForPath(SECURENOW_INFRASTRUCTURE_DRIFT_PATH)).toBe(SECURENOW_INFRASTRUCTURE_DRIFT_PATH);
    expect(driftWorkbenchNavHrefForPath(SECURENOW_INFRASTRUCTURE_DRIFT_LEGACY_PATH)).toBe(
      SECURENOW_INFRASTRUCTURE_DRIFT_PATH,
    );
    expect(driftWorkbenchNavHrefForPath(GOVERNANCE_INFRASTRUCTURE_DRIFT_PATH)).toBe(
      GOVERNANCE_INFRASTRUCTURE_DRIFT_PATH,
    );
  });
});