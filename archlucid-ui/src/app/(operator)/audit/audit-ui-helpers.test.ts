import { describe, expect, it } from "vitest";

import { canExportAuditCsv, formatAuditSummaryHeading, principalRolesAllowAuditCsvExport } from "./audit-ui-helpers";

describe("formatAuditSummaryHeading", () => {
  it("formats zero", () => {
    expect(formatAuditSummaryHeading(0, false)).toBe("Showing 0 events");
  });

  it("formats singular without plus", () => {
    expect(formatAuditSummaryHeading(1, false)).toBe("Showing 1 event");
  });

  it("formats plural with plus when more pages exist", () => {
    expect(formatAuditSummaryHeading(200, true)).toBe("Showing 200+ events");
  });
});

describe("canExportAuditCsv", () => {
  it("is false when either bound is empty", () => {
    expect(canExportAuditCsv("", "2024-01-02")).toBe(false);
    expect(canExportAuditCsv("2024-01-01", "")).toBe(false);
  });

  it("is true when both bounds are non-empty", () => {
    expect(canExportAuditCsv("2024-01-01T00:00", "2024-01-02T00:00")).toBe(true);
  });
});

describe("principalRolesAllowAuditCsvExport", () => {
  it("is true for Auditor or Admin (case-insensitive)", () => {
    expect(principalRolesAllowAuditCsvExport(["Auditor"])).toBe(true);
    expect(principalRolesAllowAuditCsvExport(["Reader", "Admin"])).toBe(true);
    expect(principalRolesAllowAuditCsvExport(["auditor"])).toBe(true);
  });

  it("is false for Reader or Operator alone", () => {
    expect(principalRolesAllowAuditCsvExport(["Reader"])).toBe(false);
    expect(principalRolesAllowAuditCsvExport(["Operator"])).toBe(false);
    expect(principalRolesAllowAuditCsvExport([])).toBe(false);
  });
});
