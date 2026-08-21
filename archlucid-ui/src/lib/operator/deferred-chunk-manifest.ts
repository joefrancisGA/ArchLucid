import type { DeferredChunkLoadingVariant } from "@/components/ui/deferred-chunk-loading";

import { ALERT_RULES_HUB_CHUNK_MANIFEST } from "@/lib/operator/alert-rules-hub-chunk-manifest";
import { ALERTS_INBOX_CHUNK_MANIFEST } from "@/lib/operator/alerts-inbox-chunk-manifest";
import { APP_SHELL_CHUNK_MANIFEST } from "@/lib/operator/app-shell-chunk-manifest";
import { GOVERNANCE_WORKFLOW_CHUNK_MANIFEST } from "@/lib/operator/governance-workflow-chunk-manifest";
import { MARKETING_CHUNK_MANIFEST } from "@/lib/operator/marketing-chunk-manifest";
import { OPERATOR_SHELL_TOP_BAR_CHUNK_MANIFEST } from "@/lib/operator/operator-shell-top-bar-chunk-manifest";
import { OPERATOR_HOME_CHUNK_MANIFEST } from "@/lib/operator/operator-home-chunk-manifest";
import { POLICY_PACKS_AUTHORING_CHUNK_MANIFEST } from "@/lib/operator/policy-packs-authoring-chunk-manifest";
import { REVIEWS_HUB_CHUNK_MANIFEST } from "@/lib/operator/reviews-hub-chunk-manifest";
import { RUN_DETAIL_CHUNK_MANIFEST } from "@/lib/operator/run-detail-chunk-manifest";
import { SIGNED_RECORDS_LIST_CHUNK_MANIFEST } from "@/lib/operator/signed-records-list-chunk-manifest";
import { SPONSOR_ROI_DASHBOARD_CHUNK_MANIFEST } from "@/lib/operator/sponsor-roi-dashboard-chunk-manifest";

export type DeferredChunkManifestEntry = {
  readonly id: string;
  readonly label: string;
  readonly variant: DeferredChunkLoadingVariant;
  readonly modulePath: string;
  readonly exportName: string;
};

/** Route-level deferred chunk catalog for TB-2371 manifest + import tests. */
export const DEFERRED_CHUNK_MANIFEST: readonly DeferredChunkManifestEntry[] = [
  ...OPERATOR_HOME_CHUNK_MANIFEST,
  ...REVIEWS_HUB_CHUNK_MANIFEST,
  ...RUN_DETAIL_CHUNK_MANIFEST,
  ...GOVERNANCE_WORKFLOW_CHUNK_MANIFEST,
  ...POLICY_PACKS_AUTHORING_CHUNK_MANIFEST,
  ...ALERT_RULES_HUB_CHUNK_MANIFEST,
  ...SIGNED_RECORDS_LIST_CHUNK_MANIFEST,
  ...SPONSOR_ROI_DASHBOARD_CHUNK_MANIFEST,
  ...ALERTS_INBOX_CHUNK_MANIFEST,
  ...APP_SHELL_CHUNK_MANIFEST,
  ...OPERATOR_SHELL_TOP_BAR_CHUNK_MANIFEST,
  ...MARKETING_CHUNK_MANIFEST,
] as const;

export function deferredChunkManifestEntry(id: string): DeferredChunkManifestEntry | undefined {
  return DEFERRED_CHUNK_MANIFEST.find((entry) => entry.id === id);
}
