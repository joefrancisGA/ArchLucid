import { fetchInfraEvidenceSnapshots } from "@/lib/infra-evidence/infra-evidence-drift-api";

import { resolveLatestSnapshotCaptureIsPartialFromSnapshot } from "./resolve-latest-snapshot-capture-partial-shared";

/** True when the newest listed snapshot has Partial capture status. */
export async function resolveLatestSnapshotCaptureIsPartial(): Promise<boolean> {
  try {
    const page = await fetchInfraEvidenceSnapshots(1, 1);
    const first = page.items?.[0];

    if (first == null) {
      return false;
    }

    return resolveLatestSnapshotCaptureIsPartialFromSnapshot(first.captureStatus);
  } catch {
    return false;
  }
}