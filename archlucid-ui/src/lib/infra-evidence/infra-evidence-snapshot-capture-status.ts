import type { EnterpriseStatusKind } from "@/lib/design-tokens";

export type InfraEvidenceSnapshotCaptureStatusPresentation = {
  readonly kind: EnterpriseStatusKind;
  readonly label: "Ready" | "Needs attention" | "In progress" | "Blocked";
  readonly description: string;
};

const READY: InfraEvidenceSnapshotCaptureStatusPresentation = {
  kind: "ready",
  label: "Ready",
  description: "Inventory capture completed.",
};

const PARTIAL: InfraEvidenceSnapshotCaptureStatusPresentation = {
  kind: "needs-attention",
  label: "Needs attention",
  description: "Inventory capture completed with gaps.",
};

const PENDING: InfraEvidenceSnapshotCaptureStatusPresentation = {
  kind: "in-progress",
  label: "In progress",
  description: "Inventory capture is still running.",
};

const FAILED: InfraEvidenceSnapshotCaptureStatusPresentation = {
  kind: "blocked",
  label: "Blocked",
  description: "Inventory capture failed.",
};

const UNRECOGNIZED: InfraEvidenceSnapshotCaptureStatusPresentation = {
  kind: "needs-attention",
  label: "Needs attention",
  description: "Inventory capture status is not recognized.",
};

type CaptureLifecycle = "pending" | "succeeded" | "partial" | "failed";

/**
 * The snapshots API writes `AzureInventoryCaptureStatus` as a string
 * (`Pending`, `Succeeded`, `Partial`, `Failed`). Older fixtures still use the enum numbers.
 */
function parseCaptureLifecycle(captureStatus: number | string | null | undefined): CaptureLifecycle | null {
  if (typeof captureStatus === "number" && Number.isFinite(captureStatus)) {
    switch (captureStatus) {
      case 0:
        return "pending";
      case 1:
        return "succeeded";
      case 2:
        return "partial";
      case 3:
        return "failed";
      default:
        return null;
    }
  }

  if (typeof captureStatus !== "string") {
    return null;
  }

  switch (captureStatus.trim().toLowerCase()) {
    case "0":
    case "pending":
      return "pending";
    case "1":
    case "succeeded":
      return "succeeded";
    case "2":
    case "partial":
      return "partial";
    case "3":
    case "failed":
      return "failed";
    default:
      return null;
  }
}

/** Maps Azure inventory capture lifecycle to canonical StatusTag presentation. */
export function resolveInfraEvidenceSnapshotCaptureStatusPresentation(
  captureStatus: number | string | null | undefined,
): InfraEvidenceSnapshotCaptureStatusPresentation {
  switch (parseCaptureLifecycle(captureStatus)) {
    case "succeeded":
      return READY;
    case "partial":
      return PARTIAL;
    case "pending":
      return PENDING;
    case "failed":
      return FAILED;
    default:
      return UNRECOGNIZED;
  }
}

/** Props for the inventory-snapshot capture `StatusTag`, including why the badge was chosen. */
export function infraEvidenceSnapshotCaptureStatusTagProps(
  captureStatus: number | string | null | undefined,
): {
  readonly kind: EnterpriseStatusKind;
  readonly label: InfraEvidenceSnapshotCaptureStatusPresentation["label"];
  readonly title: string;
  readonly "aria-label": string;
} {
  const presentation = resolveInfraEvidenceSnapshotCaptureStatusPresentation(captureStatus);

  return {
    kind: presentation.kind,
    label: presentation.label,
    title: presentation.description,
    "aria-label": `${presentation.label}. ${presentation.description}`,
  };
}
