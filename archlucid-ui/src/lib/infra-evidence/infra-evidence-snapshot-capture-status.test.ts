import { describe, expect, it } from "vitest";

import { resolveInfraEvidenceSnapshotCaptureStatusPresentation } from "@/lib/infra-evidence/infra-evidence-snapshot-capture-status";

describe("resolveInfraEvidenceSnapshotCaptureStatusPresentation", () => {
  it("maps succeeded captures to Ready", () => {
    expect(resolveInfraEvidenceSnapshotCaptureStatusPresentation(1)).toEqual({
      kind: "ready",
      label: "Ready",
    });
  });

  it("maps partial captures to Needs attention", () => {
    expect(resolveInfraEvidenceSnapshotCaptureStatusPresentation(2)).toEqual({
      kind: "needs-attention",
      label: "Needs attention",
    });
  });

  it("maps pending and failed captures to Blocked", () => {
    expect(resolveInfraEvidenceSnapshotCaptureStatusPresentation(0)).toEqual({
      kind: "blocked",
      label: "Blocked",
    });
    expect(resolveInfraEvidenceSnapshotCaptureStatusPresentation(3)).toEqual({
      kind: "blocked",
      label: "Blocked",
    });
  });
});
