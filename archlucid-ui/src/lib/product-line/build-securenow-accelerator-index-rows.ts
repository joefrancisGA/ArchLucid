import { SECURENOW_INFRASTRUCTURE_DRIFT_PATH, SECURENOW_INFRASTRUCTURE_EXTRACT_UPLOAD_PATH } from "@/lib/governance/governance-infrastructure-route-paths";
import type { SecureNowHomeDestinationRow } from "@/lib/product-line/securenow-home-destination-rows";
import { SECURENOW_ACCELERATOR_INDEX_ROWS } from "@/lib/product-line/securenow-accelerator-index-copy";
import { resolveSecureNowCaptureStartHereHref } from "@/lib/product-line/resolve-securenow-capture-start-here";

/** Start here is Manual upload until a succeeded capture exists; then it is Changes and drift for that snapshot. */
export function buildSecureNowAcceleratorIndexRows(input: {
  readonly latestSnapshotId: string | null;
}): readonly SecureNowHomeDestinationRow[] {
  const latestSnapshotId = input.latestSnapshotId?.trim() ?? "";
  const hasSnapshot = latestSnapshotId.length > 0;
  const startHereHref = resolveSecureNowCaptureStartHereHref(input.latestSnapshotId);

  return SECURENOW_ACCELERATOR_INDEX_ROWS.map((row) => {
    if (hasSnapshot && row.href === SECURENOW_INFRASTRUCTURE_DRIFT_PATH) {
      return {
        ...row,
        href: startHereHref,
        label: "Changes and drift (start here)",
        recommendedFirst: true,
      };
    }

    if (!hasSnapshot && row.href === SECURENOW_INFRASTRUCTURE_EXTRACT_UPLOAD_PATH) {
      return {
        ...row,
        label: "Manual upload (start here)",
        recommendedFirst: true,
      };
    }

    if (row.label === "Pilot walkthrough (start here)") {
      return {
        ...row,
        label: "Pilot walkthrough (fixture)",
        recommendedFirst: false,
      };
    }

    return { ...row, recommendedFirst: false };
  });
}
