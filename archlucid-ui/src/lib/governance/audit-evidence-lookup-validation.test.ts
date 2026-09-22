import { describe, expect, it } from "vitest";

import {
  auditEvidenceLookupIdentifiersReady,
  formatAuditEvidenceLookupReadinessMessage,
  isAuditEvidenceControlIdShape,
  validateAuditEvidenceLookupIdentifiers,
} from "@/lib/governance/audit-evidence-lookup-validation";

const VALID_ASSESSMENT = "11111111-1111-1111-1111-111111111111";
const VALID_SNAPSHOT = "22222222-2222-2222-2222-222222222222";
const VALID_CONTROL = "33333333-3333-3333-3333-333333333333";

describe("audit-evidence-lookup-validation", () => {
  it("accepts UUID assessment and snapshot with UUID or control-key control id", () => {
    expect(
      auditEvidenceLookupIdentifiersReady(VALID_ASSESSMENT, VALID_SNAPSHOT, "33333333-3333-3333-3333-333333333333"),
    ).toBe(true);
    expect(auditEvidenceLookupIdentifiersReady(VALID_ASSESSMENT, VALID_SNAPSHOT, "AC-2")).toBe(true);
    expect(isAuditEvidenceControlIdShape("AC-2")).toBe(true);
  });

  it("rejects malformed assessment, snapshot, and control identifiers", () => {
    const errors = validateAuditEvidenceLookupIdentifiers("not-a-uuid", VALID_SNAPSHOT, "!!!");

    expect(errors.assessmentId).toBeDefined();
    expect(errors.controlId).toBeDefined();
    expect(errors.snapshotId).toBeUndefined();
  });

  it("names missing identifier fields in the readiness message", () => {
    expect(formatAuditEvidenceLookupReadinessMessage("", "", "")).toContain("Assessment ID");
    expect(formatAuditEvidenceLookupReadinessMessage("bad", VALID_SNAPSHOT, VALID_CONTROL)).toContain(
      "Assessment ID",
    );
    expect(
      formatAuditEvidenceLookupReadinessMessage(VALID_ASSESSMENT, VALID_SNAPSHOT, VALID_CONTROL),
    ).toContain("ready");
  });
});
