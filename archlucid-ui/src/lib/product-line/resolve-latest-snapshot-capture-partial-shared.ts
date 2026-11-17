export function resolveLatestSnapshotCaptureIsPartialFromSnapshot(
  captureStatus: number | string | null | undefined,
): boolean {
  if (typeof captureStatus === "number" && Number.isFinite(captureStatus)) {
    return captureStatus === 2;
  }

  if (typeof captureStatus !== "string") {
    return false;
  }

  switch (captureStatus.trim().toLowerCase()) {
    case "2":
    case "partial":
      return true;
    default:
      return false;
  }
}