"use client";

import { BUYER_CTO_DEMO_READ_ONLY_SNAPSHOT_BANNER } from "@/lib/buyer-polish-copy";

export function CtoDemoReadOnlySnapshotBanner(): React.JSX.Element {
  return (
    <div
      role="status"
      data-testid="cto-demo-readonly-snapshot-banner"
      className="rounded-md border border-neutral-300 bg-neutral-100 px-3 py-2 text-sm text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900/60 dark:text-neutral-200"
    >
      {BUYER_CTO_DEMO_READ_ONLY_SNAPSHOT_BANNER}
    </div>
  );
}
