import { isCtoDemoOperatorToolingEnv } from "@/lib/cto-demo-presenter-pack";
import { isShowcaseSpineStaticPayloadActiveForRun, tryStaticDemoManifestSummary } from "@/lib/operator/operator-static-demo";
import {
  SHOWCASE_STATIC_DEMO_MANIFEST_ID,
  SHOWCASE_STATIC_DEMO_RUN_ID,
} from "@/lib/showcase-static-demo";

/** Buyer-safe detail by default; internal setup instructions only for demo-operator tooling. */
export function readinessDetail(buyerFacing: string, operatorFacing: string): string {
  if (isCtoDemoOperatorToolingEnv()) {
    return operatorFacing;
  }

  return buyerFacing;
}

export function isShowcaseStaticSpineReady(): boolean {
  if (!isShowcaseSpineStaticPayloadActiveForRun(SHOWCASE_STATIC_DEMO_RUN_ID)) {
    return false;
  }

  const staticManifest = tryStaticDemoManifestSummary(SHOWCASE_STATIC_DEMO_MANIFEST_ID);

  if (staticManifest === null) {
    return false;
  }

  return /^committed$/i.test(staticManifest.status ?? "");
}
