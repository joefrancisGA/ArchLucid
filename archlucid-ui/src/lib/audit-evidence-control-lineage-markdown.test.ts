import { describe, expect, it } from "vitest";

import {
  controlEvidenceMarkdownFileName,
  formatAuditEvidenceControlLineageMarkdown,
} from "./audit-evidence-control-lineage-markdown";

describe("formatAuditEvidenceControlLineageMarkdown", () => {
  it("labels incomplete lineage as NOT VERIFIED", () => {
    const markdown = formatAuditEvidenceControlLineageMarkdown({
      controlNumber: "AC-1",
      controlTitle: "Access control",
      assessmentId: "assessment-1",
      auditEvidenceSnapshotId: "snapshot-1",
      chainComplete: false,
      snapshotHashVerified: true,
      readyForPositiveCheckbox: false,
      brokenLinkReasons: ["Missing later capture"],
      latestRemediationAttempt: {
        instanceId: "instance-1",
        status: "VerificationFailed",
        updatedUtc: "2026-10-30T12:00:00Z",
      },
      verifiedRemediationAssociations: [],
    });

    expect(markdown).toContain("**Status:** NOT VERIFIED");
    expect(markdown).toContain("Missing later capture");
    expect(markdown).not.toContain("**Status:** Verified");
  });

  it("labels complete lineage as ready for human disposition", () => {
    const markdown = formatAuditEvidenceControlLineageMarkdown({
      controlNumber: "AC-2",
      controlTitle: "Account management",
      chainComplete: true,
      snapshotHashVerified: true,
      readyForPositiveCheckbox: true,
      verifiedRemediationAssociations: [
        {
          associationId: "association-1",
          instanceId: "instance-1",
          status: "Verified",
          verificationSnapshotId: "snapshot-2",
          controlId: "control-2",
        },
      ],
    });

    expect(markdown).toContain("**Status:** Ready for human disposition");
    expect(markdown).not.toContain("**Status:** Verified");
    expect(markdown).toContain("association-1");
  });
});

describe("controlEvidenceMarkdownFileName", () => {
  it("creates a safe control evidence filename", () => {
    expect(controlEvidenceMarkdownFileName("AC 2 / privileged")).toBe(
      "control-evidence-AC-2-privileged.md",
    );
  });
});
