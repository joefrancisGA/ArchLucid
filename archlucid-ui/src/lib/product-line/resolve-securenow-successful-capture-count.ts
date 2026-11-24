import { fetchInfraEvidenceSnapshots } from "@/lib/infra-evidence/infra-evidence-drift-api";
import { isInfraEvidenceSnapshotCaptureSucceeded } from "@/lib/infra-evidence/infra-evidence-snapshot-capture-status";

const SUCCESSFUL_CAPTURE_LOOKUP_PAGE_SIZE = 50;

/** Counts successful inventory captures listed for the workspace (not a usage metric). */
export async function resolveSecureNowSuccessfulCaptureCount(): Promise<number> {
  try {
    const page = await fetchInfraEvidenceSnapshots(1, SUCCESSFUL_CAPTURE_LOOKUP_PAGE_SIZE);

    return (page.items ?? []).filter((row) => isInfraEvidenceSnapshotCaptureSucceeded(row.captureStatus)).length;
  } catch {
    return 0;
  }
}
