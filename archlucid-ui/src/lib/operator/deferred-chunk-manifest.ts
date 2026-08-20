import type { DeferredChunkLoadingVariant } from "@/components/ui/deferred-chunk-loading";

export type DeferredChunkManifestEntry = {
  readonly id: string;
  readonly label: string;
  readonly variant: DeferredChunkLoadingVariant;
  readonly modulePath: string;
  readonly exportName: string;
};

/** Route-level deferred chunk catalog for TB-2371 manifest + import tests. */
export const DEFERRED_CHUNK_MANIFEST: readonly DeferredChunkManifestEntry[] = [
  {
    id: "operator-home-command-center",
    label: "Loading overview command center",
    variant: "panel",
    modulePath: "@/components/usability/PilotCommandCenterCard",
    exportName: "PilotCommandCenterCard",
  },
  {
    id: "operator-home-hero",
    label: "Loading overview hero",
    variant: "panel",
    modulePath: "@/components/operator-home/BuyerPolishedHomeHeroSection",
    exportName: "BuyerPolishedHomeHeroSection",
  },
  {
    id: "operator-home-gate",
    label: "Checking workspace access",
    variant: "section",
    modulePath: "@/components/operator-home/OperatorHomeGate",
    exportName: "OperatorHomeGate",
  },
  {
    id: "operator-home-runs-dashboard",
    label: "Loading recent reviews",
    variant: "panel",
    modulePath: "@/components/operator-home/RunsDashboardPanel",
    exportName: "RunsDashboardPanel",
  },
  {
    id: "operator-shell-top-bar",
    label: "Loading shell navigation",
    variant: "compact",
    modulePath: "@/components/shell/OperatorShellTopBar",
    exportName: "OperatorShellTopBar",
  },
  {
    id: "reviews-hub-inventory",
    label: "Loading reviews inventory",
    variant: "section",
    modulePath: "@/app/(operator)/architecture/reviews/_sections/ReviewsHubReviewInventory",
    exportName: "ReviewsHubReviewInventory",
  },
] as const;

export function deferredChunkManifestEntry(id: string): DeferredChunkManifestEntry | undefined {
  return DEFERRED_CHUNK_MANIFEST.find((entry) => entry.id === id);
}
