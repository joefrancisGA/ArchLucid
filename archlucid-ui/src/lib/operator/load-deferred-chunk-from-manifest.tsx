import dynamic from "next/dynamic";
import type { ComponentType, JSX } from "react";

import { DeferredChunkLoading } from "@/components/ui/deferred-chunk-loading";
import { deferredChunkLoader } from "@/lib/import-deferred-chunk-with-retry";
import {
  deferredChunkManifestEntry,
  type DeferredChunkManifestEntry,
} from "@/lib/operator/deferred-chunk-manifest";
import { OPERATOR_HOME_CHUNK_MANIFEST } from "@/lib/operator/operator-home-chunk-manifest";

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

/** Static import map so webpack can split operator-home deferred chunks predictably. */
function resolveDeferredChunkImportLoader(entryId: string): () => Promise<ComponentType<Record<string, unknown>>> {
  switch (entryId) {
    case "operator-home-command-center":
      return deferredChunkLoader(() =>
        import("@/components/usability/PilotCommandCenterCard").then(
          (module) => module.PilotCommandCenterCard,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "operator-home-hero":
      return deferredChunkLoader(() =>
        import("@/components/operator-home/BuyerPolishedHomeHeroSection").then(
          (module) => module.BuyerPolishedHomeHeroSection,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "operator-home-gate":
      return deferredChunkLoader(() =>
        import("@/components/operator-home/OperatorHomeGate").then((module) => module.OperatorHomeGate),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "operator-home-below-fold":
      return deferredChunkLoader(() =>
        import("@/app/(operator)/_sections/OperatorHomeBelowFoldPanels").then(
          (module) => module.OperatorHomeBelowFoldPanels,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "operator-home-stickiness":
      return deferredChunkLoader(() =>
        import("@/components/operator-home/OperatorHomeStickinessCockpit").then(
          (module) => module.OperatorHomeStickinessCockpit,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "operator-home-sponsor-roi":
      return deferredChunkLoader(() =>
        import("@/components/operator-home/OperatorHomeSponsorRoiStrip").then(
          (module) => module.OperatorHomeSponsorRoiStrip,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "operator-home-runs-dashboard":
      return deferredChunkLoader(() =>
        import("@/components/operator-home/RunsDashboardPanel").then(
          (module) => module.RunsDashboardPanel,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    default:
      throw new Error(`No deferred chunk import loader registered for manifest entry "${entryId}".`);
  }
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
