import { fetchInfraEvidenceSnapshots } from "@/lib/infra-evidence/infra-evidence-drift-api";

function parseCaptureLifecycle(captureStatus: number | string | null | undefined): "partial" | null {
  if (typeof captureStatus === "number" && Number.isFinite(captureStatus)) {
    return captureStatus === 2 ? "partial" : null;
  }

  if (typeof captureStatus !== "string") {
    return null;
  }

  switch (captureStatus.trim().toLowerCase()) {
    case "2":
    case "partial":
      return "partial";
    default:
      return null;
  }
}

/** True when the newest listed snapshot has Partial capture status. */
export async function resolveLatestSnapshotCaptureIsPartial(): Promise<boolean> {
  try {
    const page = await fetchInfraEvidenceSnapshots(1, 1);
    const first = page.items?.[0];

    if (first == null) {
      return false;
    }

    return parseCaptureLifecycle(first.captureStatus) === "partial";
  } catch {
    return false;
  }
}