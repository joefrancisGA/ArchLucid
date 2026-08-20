import type { DeferredChunkManifestEntry } from "@/lib/operator/deferred-chunk-manifest";

/** TB-2371 — sponsor ROI dashboard deferred chunk catalog (wave 1). */
export const SPONSOR_ROI_DASHBOARD_CHUNK_MANIFEST: readonly DeferredChunkManifestEntry[] = [
  {
    id: "sponsor-roi-dashboard-next-action",
    label: "Loading next action",
    variant: "section",
    modulePath: "@/app/(operator)/architecture/sponsor-dashboard/_sections/SponsorDashboardNextActionSection",
    exportName: "SponsorDashboardNextActionSection",
  },
] as const;
