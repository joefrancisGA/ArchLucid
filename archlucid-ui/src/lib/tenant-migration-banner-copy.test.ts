import { describe, expect, it } from "vitest";

import {
  formatTenantMigrationStageLabel,
  resolveTenantMigrationSuspendMessage,
  TENANT_MIGRATION_DEFAULT_SUSPEND_MESSAGE,
} from "@/lib/tenant-migration-banner-copy";

describe("resolveTenantMigrationSuspendMessage", () => {
  it("prefers a custom server maintenance message over stage copy", () => {
    expect(
      resolveTenantMigrationSuspendMessage({
        message: "  Writes frozen during catalog move.  ",
        stage: "ProjectionRefresh",
      }),
    ).toBe("Writes frozen during catalog move.");
  });

  it("uses stage suspend copy when the server message is the generic default", () => {
    expect(
      resolveTenantMigrationSuspendMessage({
        message: TENANT_MIGRATION_DEFAULT_SUSPEND_MESSAGE,
        stage: "ProjectionRefresh",
      }),
    ).toContain("reads may be stale");
  });

  it.each([
    ["ScopeFreeze", "new writes are suspended"],
    ["CatalogAttachDetach", "Catalog attach/detach"],
    ["ProjectionRefresh", "reads may be stale"],
    ["Verification", "verification is running"],
  ] as const)("maps %s to suspend copy", (stage, fragment) => {
    expect(resolveTenantMigrationSuspendMessage({ stage })).toContain(fragment);
  });

  it("falls back to the default suspend message", () => {
    expect(resolveTenantMigrationSuspendMessage({})).toBe(TENANT_MIGRATION_DEFAULT_SUSPEND_MESSAGE);
  });
});

describe("formatTenantMigrationStageLabel", () => {
  it("humanizes known fan-out stages", () => {
    expect(formatTenantMigrationStageLabel("ProjectionRefresh")).toBe("Projection refresh");
  });

  it("returns null for empty stage", () => {
    expect(formatTenantMigrationStageLabel("")).toBeNull();
  });
});
