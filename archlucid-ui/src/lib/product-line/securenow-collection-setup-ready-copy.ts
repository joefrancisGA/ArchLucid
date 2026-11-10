import { SECURENOW_REMEDIATION_FACTORY_PATH } from "@/lib/governance/governance-route-paths";
import { encodeSecureNowSnapshotDriftHref } from "@/lib/product-line/resolve-securenow-capture-start-here";

export const SECURENOW_COLLECTION_READY_NEXT_LABEL = "Next step" as const;

export const SECURENOW_COLLECTION_READY_NEXT_SUMMARY =
  "Collection is ready. Open one ranked path. A blank ranking is not a clean result." as const;

export function resolveSecureNowCollectionReadyNextHref(latestSnapshotId: string | null): string {
  const trimmed = latestSnapshotId?.trim() ?? "";

  if (trimmed.length > 0) {
    return encodeSecureNowSnapshotDriftHref(trimmed);
  }

  return SECURENOW_REMEDIATION_FACTORY_PATH;
}

export function resolveSecureNowCollectionReadyNextLinkLabel(latestSnapshotId: string | null): string {
  const trimmed = latestSnapshotId?.trim() ?? "";

  if (trimmed.length > 0) {
    return "Open Changes and drift, then one ranked path";
  }

  return "Open Path inspect";
}
