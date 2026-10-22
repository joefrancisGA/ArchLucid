import { describe, expect, it } from "vitest";

import {
  parseAuditEvidenceLookupIdentifierDraft,
  persistAuditEvidenceLookupIdentifierDraft,
  readAuditEvidenceLookupIdentifierDraft,
} from "@/lib/governance/audit-evidence-lookup-identifier-draft";

describe("audit-evidence-lookup-identifier-draft", () => {
  it("round-trips v1 identifier draft through localStorage", () => {
    persistAuditEvidenceLookupIdentifierDraft({
      assessmentId: "a",
      snapshotId: "s",
      controlId: "c",
    });

    const draft = readAuditEvidenceLookupIdentifierDraft();

    expect(draft?.schemaVersion).toBe(1);
    expect(draft?.assessmentId).toBe("a");
    expect(draft?.snapshotId).toBe("s");
    expect(draft?.controlId).toBe("c");
  });

  it("rejects unknown schema versions", () => {
    expect(
      parseAuditEvidenceLookupIdentifierDraft(
        JSON.stringify({ schemaVersion: 2, assessmentId: "a", snapshotId: "s", controlId: "c" }),
      ),
    ).toBeNull();
  });
});
