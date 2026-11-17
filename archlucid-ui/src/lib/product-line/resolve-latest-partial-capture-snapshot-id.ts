import { fetchInfraEvidenceSnapshots } from "@/lib/infra-evidence/infra-evidence-drift-api";

import { resolveLatestSnapshotCaptureIsPartialFromSnapshot } from "./resolve-latest-snapshot-capture-partial-shared";

/** Newest snapshot id when capture status is Partial; otherwise null. */
export async function resolveLatestPartialCaptureSnapshotId(): Promise<string | null> {
  try {
    const page = await fetchInfraEvidenceSnapshots(1, 1);
    const first = page.items?.[0];

    if (first == null) {
      return null;
    }

    if (!resolveLatestSnapshotCaptureIsPartialFromSnapshot(first.captureStatus)) {
      return null;
    }

    const id = first.snapshotId?.trim() ?? "";

    return id.length > 0 ? id : null;
  } catch {
    return null;
  }
}