import { describe, expect, it } from "vitest";

import {
  auditEventLifecycleSortKey,
  auditEventLifecycleStageLabel,
  auditEventsAreLifecycleOnlyForGrouping,
  canExportAuditCsv,
  formatAuditSummaryHeading,
  groupAuditEventsByLifecycleStage,
  principalRolesAllowAuditCsvExport,
} from "./audit-ui-helpers";

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

describe("auditEventLifecycleSortKey", () => {
  it("orders known pipeline codes before unknown types", () => {
    expect(auditEventLifecycleSortKey("RunStarted")).toBeLessThan(auditEventLifecycleSortKey("context.snapshot.created"));
    expect(auditEventLifecycleSortKey("finalize.run")).toBeLessThan(auditEventLifecycleSortKey("com.archlucid.alert.fired"));
  });
});

describe("audit lifecycle grouping", () => {
  it("maps PascalCase audit spine types into grouping headings via Contracts parity", () => {
    expect(auditEventLifecycleStageLabel("ManifestGenerated")).toBe("Manifest finalized");
    expect(auditEventLifecycleStageLabel("GovernanceApprovalRequested")).toBe("Governance handoff");
    expect(auditEventLifecycleStageLabel("RunSubmitted")).toBe("Review started");
  });

  it("detects eligibility only when every event maps to a lifecycle stage", () => {
    expect(auditEventsAreLifecycleOnlyForGrouping([{ eventType: "RunStarted" }, { eventType: "finalize.run" }])).toBe(
      true,
    );
    expect(auditEventsAreLifecycleOnlyForGrouping([])).toBe(false);
    expect(auditEventsAreLifecycleOnlyForGrouping([{ eventType: "RunStarted" }, { eventType: "unknown.thing" }])).toBe(
      false,
    );
  });

  it("groups events in pipeline order", () => {
    const grouped = groupAuditEventsByLifecycleStage([
      { eventType: "artifact.bundle.created" },
      { eventType: "RunStarted" },
      { eventType: "context.snapshot.created" },
    ]);

    expect(grouped.map((g) => g.stage)).toEqual(["Review started", "Context captured", "Artifacts bundled"]);
    expect(grouped[0]?.events).toHaveLength(1);
    expect(grouped[0]?.events[0]?.eventType).toBe("RunStarted");
  });

  it("places governance handoff after manifest artifacts in canonical order", () => {
    const grouped = groupAuditEventsByLifecycleStage([
      { eventType: "GovernanceApprovalRequested" },
      { eventType: "RunStarted" },
      { eventType: "ManifestGenerated" },
    ]);

    expect(grouped.map((g) => g.stage)).toEqual([
      "Review started",
      "Manifest finalized",
      "Governance handoff",
    ]);
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
