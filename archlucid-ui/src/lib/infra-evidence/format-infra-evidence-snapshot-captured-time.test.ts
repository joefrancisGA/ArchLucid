import { describe, expect, it } from "vitest";

import {
  formatInfraEvidenceSnapshotCapturedTimeTitle,
  formatInfraEvidenceSnapshotCapturedUtcLabel,
  resolveInfraEvidenceSnapshotCapturedTimeIso,
} from "@/lib/infra-evidence/format-infra-evidence-snapshot-captured-time";

describe("format-infra-evidence-snapshot-captured-time", () => {
  it("formats UTC alongside local title text", () => {
    const iso = "2026-09-01T12:00:00Z";

    expect(resolveInfraEvidenceSnapshotCapturedTimeIso(iso)).toBe(iso);
    expect(formatInfraEvidenceSnapshotCapturedUtcLabel(iso)).toContain("UTC");
    expect(formatInfraEvidenceSnapshotCapturedTimeTitle(iso)).toContain("UTC");
  });
});
