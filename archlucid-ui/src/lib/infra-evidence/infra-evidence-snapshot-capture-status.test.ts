import { describe, expect, it } from "vitest";

import {
  infraEvidenceSnapshotCaptureStatusTagProps,
  resolveInfraEvidenceSnapshotCaptureStatusPresentation,
} from "@/lib/infra-evidence/infra-evidence-snapshot-capture-status";

describe("resolveInfraEvidenceSnapshotCaptureStatusPresentation", () => {
  it("maps succeeded captures to Ready", () => {
    expect(resolveInfraEvidenceSnapshotCaptureStatusPresentation(1)).toEqual({
      kind: "ready",
      label: "Ready",
      description: "Inventory capture completed.",
    });
    expect(resolveInfraEvidenceSnapshotCaptureStatusPresentation("Succeeded")).toEqual({
      kind: "ready",
      label: "Ready",
      description: "Inventory capture completed.",
    });
  });

  it("maps partial captures to Needs attention", () => {
    expect(resolveInfraEvidenceSnapshotCaptureStatusPresentation(2)).toEqual({
      kind: "needs-attention",
      label: "Needs attention",
      description: "Inventory capture completed with gaps.",
    });
    expect(resolveInfraEvidenceSnapshotCaptureStatusPresentation("Partial")).toEqual({
      kind: "needs-attention",
      label: "Needs attention",
      description: "Inventory capture completed with gaps.",
    });
  });

  it("maps a still-running capture to In progress", () => {
    expect(resolveInfraEvidenceSnapshotCaptureStatusPresentation(0)).toEqual({
      kind: "in-progress",
      label: "In progress",
      description: "Inventory capture is still running.",
    });
    expect(resolveInfraEvidenceSnapshotCaptureStatusPresentation("Pending")).toEqual({
      kind: "in-progress",
      label: "In progress",
      description: "Inventory capture is still running.",
    });
  });

  it("maps a failed capture to Blocked", () => {
    expect(resolveInfraEvidenceSnapshotCaptureStatusPresentation(3)).toEqual({
      kind: "blocked",
      label: "Blocked",
      description: "Inventory capture failed.",
    });
    expect(resolveInfraEvidenceSnapshotCaptureStatusPresentation("Failed")).toEqual({
      kind: "blocked",
      label: "Blocked",
      description: "Inventory capture failed.",
    });
  });

  it("does not treat an unrecognized status as a failed capture", () => {
    expect(resolveInfraEvidenceSnapshotCaptureStatusPresentation("nope")).toEqual({
      kind: "needs-attention",
      label: "Needs attention",
      description: "Inventory capture status is not recognized.",
    });
    expect(resolveInfraEvidenceSnapshotCaptureStatusPresentation(undefined)).toEqual({
      kind: "needs-attention",
      label: "Needs attention",
      description: "Inventory capture status is not recognized.",
    });
  });
});

describe("infraEvidenceSnapshotCaptureStatusTagProps", () => {
  it("exposes the capture explanation on the status tag", () => {
    expect(infraEvidenceSnapshotCaptureStatusTagProps("Succeeded")).toEqual({
      kind: "ready",
      label: "Ready",
      title: "Inventory capture completed.",
      "aria-label": "Ready. Inventory capture completed.",
    });
  });
});
