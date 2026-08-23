import dynamic from "next/dynamic";
import type { ComponentType, JSX } from "react";

import { DeferredChunkLoading } from "@/components/ui/deferred-chunk-loading";
import {
  deferredChunkManifestEntry,
  type DeferredChunkManifestEntry,
} from "@/lib/operator/deferred-chunk-manifest";
import { resolveDeferredChunkImportLoader } from "@/lib/operator/deferred-chunk-import-loaders.generated";
import { ALERT_RULES_HUB_CHUNK_MANIFEST } from "@/lib/operator/alert-rules-hub-chunk-manifest";
import { ALERTS_INBOX_CHUNK_MANIFEST } from "@/lib/operator/alerts-inbox-chunk-manifest";
import { APP_SHELL_CHUNK_MANIFEST } from "@/lib/operator/app-shell-chunk-manifest";
import { GOVERNANCE_FINDINGS_CHUNK_MANIFEST } from "@/lib/operator/governance-findings-chunk-manifest";
import { GOVERNANCE_WORKFLOW_CHUNK_MANIFEST } from "@/lib/operator/governance-workflow-chunk-manifest";
import { MARKETING_CHUNK_MANIFEST } from "@/lib/operator/marketing-chunk-manifest";
import { OPERATOR_HOME_CHUNK_MANIFEST } from "@/lib/operator/operator-home-chunk-manifest";
import { OPERATOR_SHELL_TOP_BAR_CHUNK_MANIFEST } from "@/lib/operator/operator-shell-top-bar-chunk-manifest";
import { POLICY_PACKS_AUTHORING_CHUNK_MANIFEST } from "@/lib/operator/policy-packs-authoring-chunk-manifest";
import { REVIEWS_NEW_CHUNK_MANIFEST } from "@/lib/operator/reviews-new-chunk-manifest";
import { REVIEWS_HUB_CHUNK_MANIFEST } from "@/lib/operator/reviews-hub-chunk-manifest";
import { RUN_DETAIL_CHUNK_MANIFEST } from "@/lib/operator/run-detail-chunk-manifest";
import { SIGNED_RECORDS_LIST_CHUNK_MANIFEST } from "@/lib/operator/signed-records-list-chunk-manifest";
import { SPONSOR_ROI_DASHBOARD_CHUNK_MANIFEST } from "@/lib/operator/sponsor-roi-dashboard-chunk-manifest";

export type LoadDeferredChunkFromManifestOptions = {
  readonly ssr?: boolean;
  readonly loadingClassName?: string;
  readonly loadingTestId?: string;
  readonly loadingWrapper?: (loading: JSX.Element) => JSX.Element;
  readonly suppressLoading?: boolean;
};

function requireDeferredChunkManifestEntry(entryId: string): DeferredChunkManifestEntry {
  const entry = deferredChunkManifestEntry(entryId);

  if (entry === undefined) {
    throw new Error(`Unknown deferred chunk manifest entry "${entryId}".`);
  }

  return entry;
}

/** TB-2371 — retry-aware dynamic import loader keyed by manifest entry id. */
export function loadDeferredChunkFromManifest(
  entryId: string,
): () => Promise<ComponentType<Record<string, unknown>>> {
  requireDeferredChunkManifestEntry(entryId);

  return resolveDeferredChunkImportLoader(entryId);
}

/** TB-2371 — `next/dynamic` wrapper driven by deferred chunk manifest metadata. */
export function createDeferredComponentFromManifest<P extends Record<string, unknown> = Record<string, unknown>>(
  entryId: string,
  options: LoadDeferredChunkFromManifestOptions = {},
): ComponentType<P> {
  const entry = requireDeferredChunkManifestEntry(entryId);
  const loader = loadDeferredChunkFromManifest(entryId);

  return dynamic(loader, {
    ssr: options.ssr ?? false,
    loading: options.suppressLoading
      ? () => null
      : () => {
          const loading = (
            <DeferredChunkLoading
              label={entry.label}
              variant={entry.variant}
              testId={options.loadingTestId ?? `${entry.id}-deferred-chunk-loading`}
              className={options.loadingClassName}
            />
          );

          if (options.loadingWrapper !== undefined) {
            return options.loadingWrapper(loading);
          }

          return loading;
        },
  }) as ComponentType<P>;
}

/** Operator-home manifest ids that have registered import loaders (manifest import-test guard). */
export const OPERATOR_HOME_DEFERRED_CHUNK_LOADER_IDS: readonly string[] = OPERATOR_HOME_CHUNK_MANIFEST.map(
  (entry) => entry.id,
);

/** Reviews-hub manifest ids that have registered import loaders (manifest import-test guard). */
export const REVIEWS_HUB_DEFERRED_CHUNK_LOADER_IDS: readonly string[] = REVIEWS_HUB_CHUNK_MANIFEST.map(
  (entry) => entry.id,
);

/** Reviews-new manifest ids that have registered import loaders (manifest import-test guard). */
export const REVIEWS_NEW_DEFERRED_CHUNK_LOADER_IDS: readonly string[] = REVIEWS_NEW_CHUNK_MANIFEST.map(
  (entry) => entry.id,
);

/** Run-detail manifest ids that have registered import loaders (manifest import-test guard). */
export const RUN_DETAIL_DEFERRED_CHUNK_LOADER_IDS: readonly string[] = RUN_DETAIL_CHUNK_MANIFEST.map(
  (entry) => entry.id,
);

/** Governance-findings manifest ids that have registered import loaders (manifest import-test guard). */
export const GOVERNANCE_FINDINGS_DEFERRED_CHUNK_LOADER_IDS: readonly string[] =
  GOVERNANCE_FINDINGS_CHUNK_MANIFEST.map((entry) => entry.id);

/** Governance-workflow manifest ids that have registered import loaders (manifest import-test guard). */
export const GOVERNANCE_WORKFLOW_DEFERRED_CHUNK_LOADER_IDS: readonly string[] =
  GOVERNANCE_WORKFLOW_CHUNK_MANIFEST.map((entry) => entry.id);

/** Policy-packs authoring manifest ids that have registered import loaders (manifest import-test guard). */
export const POLICY_PACKS_AUTHORING_DEFERRED_CHUNK_LOADER_IDS: readonly string[] =
  POLICY_PACKS_AUTHORING_CHUNK_MANIFEST.map((entry) => entry.id);

/** Alert-rules hub manifest ids that have registered import loaders (manifest import-test guard). */
export const ALERT_RULES_HUB_DEFERRED_CHUNK_LOADER_IDS: readonly string[] =
  ALERT_RULES_HUB_CHUNK_MANIFEST.map((entry) => entry.id);

/** Signed-records list manifest ids that have registered import loaders (manifest import-test guard). */
export const SIGNED_RECORDS_LIST_DEFERRED_CHUNK_LOADER_IDS: readonly string[] =
  SIGNED_RECORDS_LIST_CHUNK_MANIFEST.map((entry) => entry.id);

/** Sponsor ROI dashboard manifest ids that have registered import loaders (manifest import-test guard). */
export const SPONSOR_ROI_DASHBOARD_DEFERRED_CHUNK_LOADER_IDS: readonly string[] =
  SPONSOR_ROI_DASHBOARD_CHUNK_MANIFEST.map((entry) => entry.id);

/** Alerts inbox manifest ids that have registered import loaders (manifest import-test guard). */
export const ALERTS_INBOX_DEFERRED_CHUNK_LOADER_IDS: readonly string[] = ALERTS_INBOX_CHUNK_MANIFEST.map(
  (entry) => entry.id,
);

/** App shell manifest ids that have registered import loaders (manifest import-test guard). */
export const APP_SHELL_DEFERRED_CHUNK_LOADER_IDS: readonly string[] = APP_SHELL_CHUNK_MANIFEST.map(
  (entry) => entry.id,
);

/** Operator shell top bar manifest ids that have registered import loaders (manifest import-test guard). */
export const OPERATOR_SHELL_TOP_BAR_DEFERRED_CHUNK_LOADER_IDS: readonly string[] =
  OPERATOR_SHELL_TOP_BAR_CHUNK_MANIFEST.map((entry) => entry.id);

/** Marketing manifest ids that have registered import loaders (manifest import-test guard). */
export const MARKETING_DEFERRED_CHUNK_LOADER_IDS: readonly string[] = MARKETING_CHUNK_MANIFEST.map(
  (entry) => entry.id,
);
