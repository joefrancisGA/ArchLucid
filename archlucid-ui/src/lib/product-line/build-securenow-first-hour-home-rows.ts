import { CLOUD_CONNECTIONS_PATH } from "@/lib/integrations-nav-paths";
import { SECURENOW_REMEDIATION_FACTORY_PATH } from "@/lib/governance/governance-route-paths";
import type { SecureNowHomeDestinationRow } from "@/lib/product-line/securenow-home-destination-rows";
import {
  SECURENOW_FIRST_HOUR_HOME_ROWS,
  SECURENOW_FIRST_HOUR_OPERATOR_PATH,
} from "@/lib/product-line/securenow-first-hour-home-copy";
import { resolveSecureNowFirstHourStartHereHref } from "@/lib/product-line/resolve-securenow-capture-start-here";

function isCloudConnectionsRow(row: SecureNowHomeDestinationRow): boolean {
  return row.href === CLOUD_CONNECTIONS_PATH;
}

/** Start here follows capture status: scope and freshness until ingest succeeds; then Changes and drift for that snapshot. */
export function buildSecureNowFirstHourHomeRows(input: {
  readonly latestSnapshotId: string | null;
}): readonly SecureNowHomeDestinationRow[] {
  const trimmedSnapshotId = input.latestSnapshotId?.trim() ?? "";
  const hasSnapshot = trimmedSnapshotId.length > 0;
  const startHereHref = resolveSecureNowFirstHourStartHereHref(input.latestSnapshotId);

  return SECURENOW_FIRST_HOUR_HOME_ROWS.map((row) => {
    const next: SecureNowHomeDestinationRow = { ...row, recommendedFirst: false };

    if (!hasSnapshot && isCloudConnectionsRow(row) && row.href === startHereHref) {
      return {
        ...next,
        label: "Scope and freshness (start here)",
        recommendedFirst: true,
      };
    }

    if (hasSnapshot && isCloudConnectionsRow(row)) {
      return {
        ...next,
        href: startHereHref,
        label: "Changes and drift (start here)",
        summary:
          "Open the latest successful capture. A failed API load is not the same as an empty capture.",
        recommendedFirst: true,
      };
    }

    return next;
  });
}

export const SECURENOW_FIRST_HOUR_HOME_ROW_HREFS_WITHOUT_SNAPSHOT: readonly string[] = [
  CLOUD_CONNECTIONS_PATH,
  SECURENOW_REMEDIATION_FACTORY_PATH,
  `${SECURENOW_FIRST_HOUR_OPERATOR_PATH}#path-inspect`,
  `${SECURENOW_FIRST_HOUR_OPERATOR_PATH}#stop`,
  SECURENOW_FIRST_HOUR_OPERATOR_PATH,
] as const;
