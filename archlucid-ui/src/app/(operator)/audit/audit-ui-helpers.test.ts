import { describe, expect, it } from "vitest";

import { getDemoSampleAuditTrailEvents } from "@/lib/demo-audit-sample-events";

import {
  auditBuyerEventIsSystemRecordedActor,
  auditEventLifecycleSortKey,
  auditEventLifecycleStageLabel,
  auditEventsAreLifecycleOnlyForGrouping,
  canExportAuditCsv,
  formatAuditSummaryHeading,
  formatBuyerAuditTrailSummaryLine,
  groupAuditEventsByLifecycleStage,
  principalRolesAllowAuditCsvExport,
} from "./audit-ui-helpers";

describe("auditBuyerEventIsSystemRecordedActor", () => {
  it("returns true for ArchLucid system and automation-style actors", () => {
    expect(auditBuyerEventIsSystemRecordedActor("ArchLucid system")).toBe(true);
    expect(auditBuyerEventIsSystemRecordedActor("ArchLucid Automation")).toBe(true);
    expect(auditBuyerEventIsSystemRecordedActor("Recorded by ArchLucid")).toBe(true);
  });

  it("returns false for named human reviewers", () => {
    expect(auditBuyerEventIsSystemRecordedActor("Jordan Lee")).toBe(false);
    expect(auditBuyerEventIsSystemRecordedActor("Taylor Morgan")).toBe(false);
  });

  it("returns false for blank names", () => {
    expect(auditBuyerEventIsSystemRecordedActor("")).toBe(false);
    expect(auditBuyerEventIsSystemRecordedActor("   ")).toBe(false);
  });
});

describe("formatBuyerAuditTrailSummaryLine", () => {
  it("counts ArchLucid system rows as system-recorded (demo spine parity)", () => {
    const demo = getDemoSampleAuditTrailEvents();
    const line = formatBuyerAuditTrailSummaryLine(demo, "claims-intake-modernization", "");

    expect(line).toContain("7 recorded events");
    expect(line).toContain("2 human actors");
    expect(line).toContain("4 events recorded automatically by ArchLucid lifecycle logging");
  });

  it("returns null for an empty list", () => {
    expect(formatBuyerAuditTrailSummaryLine([], null, "")).toBeNull();
  });
});

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

  it("maps governance approval recorded to governance handoff grouping", () => {
    expect(auditEventLifecycleStageLabel("com.archlucid.governance.approval.recorded")).toBe("Governance handoff");
  });

  it("orders manifest, governance handoff, then artifacts bundle in canonical lifecycle order", () => {
    const grouped = groupAuditEventsByLifecycleStage([
      { eventType: "artifact.bundle.created" },
      { eventType: "com.archlucid.governance.approval.recorded" },
      { eventType: "finalize.run" },
    ]);

    expect(grouped.map((g) => g.stage)).toEqual(["Manifest finalized", "Governance handoff", "Artifacts bundled"]);
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
