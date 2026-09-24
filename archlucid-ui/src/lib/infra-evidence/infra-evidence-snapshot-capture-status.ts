import type { EnterpriseStatusKind } from "@/lib/design-tokens";

export type InfraEvidenceSnapshotCaptureStatusPresentation = {
  readonly kind: EnterpriseStatusKind;
  readonly label: "Ready" | "Needs attention" | "Blocked";
};

/** Maps Azure inventory capture lifecycle to canonical StatusTag presentation. */
export function resolveInfraEvidenceSnapshotCaptureStatusPresentation(
  captureStatus: number,
): InfraEvidenceSnapshotCaptureStatusPresentation {
  switch (captureStatus) {
    case 1:
      return { kind: "ready", label: "Ready" };

    case 2:
      return { kind: "needs-attention", label: "Needs attention" };

    case 0:
    case 3:
    default:
      return { kind: "blocked", label: "Blocked" };
  }
}
