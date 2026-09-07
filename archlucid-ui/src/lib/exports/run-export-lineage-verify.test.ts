import { describe, expect, it } from "vitest";

import { exportVerifyBlockedRecovery } from "@/lib/exports/export-verify-recovery-copy";
import {
  formatRunExportLineageStatusLabel,
  isRunExportLineageAttested,
  type RunExportLineageVerificationResult,
} from "@/lib/exports/run-export-lineage-verify";

describe("run-export-lineage-verify (DR-10)", () => {
  it("treats Match as attested", () => {
    const result: RunExportLineageVerificationResult = {
      status: "Match",
      runId: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    };

    expect(isRunExportLineageAttested(result)).toBe(true);
    expect(formatRunExportLineageStatusLabel(result)).toBe("Attested");
  });

  it("treats NotAttested and Mismatch as not attested", () => {
    const notAttested: RunExportLineageVerificationResult = {
      status: "NotAttested",
      runId: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
      detail: "No ManifestGenerated audit anchor found for this run.",
    };

    expect(isRunExportLineageAttested(notAttested)).toBe(false);
    expect(formatRunExportLineageStatusLabel(notAttested)).toBe("Not attested");

    const mismatch: RunExportLineageVerificationResult = {
      status: "Mismatch",
      runId: "cccccccccccccccccccccccccccccccc",
    };

    expect(isRunExportLineageAttested(mismatch)).toBe(false);
  });

  it("builds TB-2155 recovery copy for blocked verify", () => {
    const recovery = exportVerifyBlockedRecovery({
      status: "NotAttested",
      runId: "dddddddddddddddddddddddddddddddd",
      detail: "Sealed manifest hash is missing on the committed golden manifest.",
    });

    expect(recovery.whatFailed).toContain("not attested");
    expect(recovery.whatIsIntact).toContain("no export file was downloaded");
    expect(recovery.nextStep).toContain("narrower export");
  });
});
