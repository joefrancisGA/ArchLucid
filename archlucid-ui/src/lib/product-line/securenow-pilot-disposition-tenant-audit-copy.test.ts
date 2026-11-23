import { describe, expect, it } from "vitest";

import { formatSecureNowPilotDispositionTenantAuditRecordedLine } from "./securenow-pilot-disposition-tenant-audit-copy";

describe("formatSecureNowPilotDispositionTenantAuditRecordedLine", () => {
  it("states UTC once when the clock label already includes UTC", () => {
    const line = formatSecureNowPilotDispositionTenantAuditRecordedLine("2026-11-14T12:00:00.000Z");

    expect(line).toContain("Tenant audit recorded at ");
    expect(line?.match(/UTC/g)).toEqual(["UTC"]);
  });
});