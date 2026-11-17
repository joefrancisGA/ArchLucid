import {
  SECURENOW_INFRASTRUCTURE_DRIFT_PATH,
  SECURENOW_INFRASTRUCTURE_EXTRACT_UPLOAD_PATH,
} from "@/lib/governance/governance-infrastructure-route-paths";
import { CLOUD_CONNECTIONS_PATH } from "@/lib/integrations-nav-paths";

export function encodeSecureNowSnapshotDriftHref(snapshotId: string): string {
  const trimmed = snapshotId.trim();

  return `${SECURENOW_INFRASTRUCTURE_DRIFT_PATH}?snapshotId=${encodeURIComponent(trimmed)}`;
}

/** First step on Home and accelerator index until a succeeded capture exists; then drift for that snapshot. */
export function resolveSecureNowCaptureStartHereHref(latestSnapshotId: string | null): string {
  const trimmed = latestSnapshotId?.trim() ?? "";

  if (trimmed.length > 0) {
    return encodeSecureNowSnapshotDriftHref(trimmed);
  }

  return SECURENOW_INFRASTRUCTURE_EXTRACT_UPLOAD_PATH;
}

export function resolveSecureNowFirstHourStartHereHref(latestSnapshotId: string | null): string {
  const trimmed = latestSnapshotId?.trim() ?? "";

  if (trimmed.length > 0) {
    return encodeSecureNowSnapshotDriftHref(trimmed);
  }

  return CLOUD_CONNECTIONS_PATH;
}
