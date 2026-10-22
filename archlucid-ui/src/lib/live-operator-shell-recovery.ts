import { isBuyerSafeDemoMarketingChromeEnv, isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator/operator-static-demo";

/** Live authenticated shell: demo flags off and static showcase fallback disabled. */
export function isLiveOperatorShellRecoveryContext(): boolean {
  if (isNextPublicDemoMode()) {
    return false;
  }

  if (isBuyerSafeDemoMarketingChromeEnv()) {
    return false;
  }

  if (isStaticDemoPayloadFallbackEnabled()) {
    return false;
  }

  return true;
}
