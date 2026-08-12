import { signedRecordDetailPath } from "@/lib/signed-records-paths";
import { isDemoRunIdEligibleForStaticFallback } from "@/lib/operator-static-demo";
import { SHOWCASE_STATIC_DEMO_MANIFEST_ID } from "@/lib/showcase-static-demo";

/**
 * When the run is the curated static demo, returns the signed review record detail href for linked-package CTAs.
 * Non-demo runs omit this until inspect/manifest correlation is first-class on the wire.
 */
export function findingLinkedManifestDetailHrefForRun(runId: string): string | null {
  if (!isDemoRunIdEligibleForStaticFallback(runId)) {
    return null;
  }

  return signedRecordDetailPath(SHOWCASE_STATIC_DEMO_MANIFEST_ID);
}
