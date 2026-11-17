"use client";

import Link from "next/link";

import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { SECURENOW_INFRASTRUCTURE_DRIFT_PATH } from "@/lib/governance/governance-infrastructure-route-paths";
import { cn } from "@/lib/utils";

export function SecureNowCollectionLatestSnapshotLine(props: {
  readonly snapshotId: string;
  readonly testIdPrefix: string;
}): React.JSX.Element {
  const snapshotId = props.snapshotId.trim();
  const driftHref = `${SECURENOW_INFRASTRUCTURE_DRIFT_PATH}?snapshotId=${encodeURIComponent(snapshotId)}`;

  return (
    <p
      className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}
      data-testid={`${props.testIdPrefix}-collection-latest-snapshot`}
    >
      Latest capture snapshot id:{" "}
      <span className="font-mono text-xs text-neutral-800 dark:text-neutral-200">{snapshotId}</span>.{" "}
      <Link href={driftHref} className={OPERATOR_LINK.inline} data-testid={`${props.testIdPrefix}-collection-drift-link`}>
        Open Changes and drift
      </Link>
    </p>
  );
}
