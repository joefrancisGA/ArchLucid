import { describe, expect, it } from "vitest";

import {
  AUDIT_EVIDENCE_LINEAGE_LOOKUP_PATH,
  SECURENOW_AUDIT_EVIDENCE_PATH,
  auditEvidenceLineageLookupPathFromPathname,
  buildAuditEvidenceControlLineagePath,
  isAuditEvidenceRoutePath,
  parseAuditEvidenceControlLineagePath,
} from "@/lib/audit-evidence-lineage-route";

describe("audit-evidence-lineage-route", () => {
  it("builds and parses a control lineage path", () => {
    const path = buildAuditEvidenceControlLineagePath("assess-1", "snap-2", "ctrl-3");

    expect(path).toBe("/governance/audit-evidence/assess-1/snapshots/snap-2/controls/ctrl-3");
    expect(parseAuditEvidenceControlLineagePath(path)).toEqual({
      assessmentId: "assess-1",
      snapshotId: "snap-2",
      controlId: "ctrl-3",
    });
  });

  it("builds and parses SecureNow compliance lineage paths", () => {
    const path = buildAuditEvidenceControlLineagePath(
      "assess-1",
      "snap-2",
      "ctrl-3",
      SECURENOW_AUDIT_EVIDENCE_PATH,
    );

    expect(path).toBe("/compliance/audit-evidence/assess-1/snapshots/snap-2/controls/ctrl-3");
    expect(parseAuditEvidenceControlLineagePath(path)).toEqual({
      assessmentId: "assess-1",
      snapshotId: "snap-2",
      controlId: "ctrl-3",
    });
  });

  it("parses absolute URLs", () => {
    expect(
      parseAuditEvidenceControlLineagePath(
        "https://app.example.com/governance/audit-evidence/a/snapshots/s/controls/c",
      ),
    ).toEqual({
      assessmentId: "a",
      snapshotId: "s",
      controlId: "c",
    });
  });

  it("returns null for invalid lineage paths", () => {
    expect(parseAuditEvidenceControlLineagePath("/governance/audit-evidence")).toBeNull();
    expect(parseAuditEvidenceControlLineagePath("not-a-url")).toBeNull();
  });

  it("detects audit evidence routes", () => {
    expect(isAuditEvidenceRoutePath(AUDIT_EVIDENCE_LINEAGE_LOOKUP_PATH)).toBe(true);
    expect(isAuditEvidenceRoutePath("/governance/audit-evidence/a/snapshots/s/controls/c")).toBe(true);
    expect(isAuditEvidenceRoutePath(SECURENOW_AUDIT_EVIDENCE_PATH)).toBe(true);
    expect(isAuditEvidenceRoutePath("/compliance/audit-evidence/a/snapshots/s/controls/c")).toBe(true);
    expect(isAuditEvidenceRoutePath("/governance/audit")).toBe(false);
  });

  it("resolves lookup path from pathname namespace", () => {
    expect(auditEvidenceLineageLookupPathFromPathname("/governance/audit-evidence/a/snapshots/s/controls/c")).toBe(
      AUDIT_EVIDENCE_LINEAGE_LOOKUP_PATH,
    );
    expect(auditEvidenceLineageLookupPathFromPathname("/compliance/audit-evidence/a/snapshots/s/controls/c")).toBe(
      SECURENOW_AUDIT_EVIDENCE_PATH,
    );
  });
});
