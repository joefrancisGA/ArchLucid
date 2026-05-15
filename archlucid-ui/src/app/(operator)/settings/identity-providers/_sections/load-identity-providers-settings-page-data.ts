import { isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator-static-demo";

/** Server passes demo flags for routing/SSR parity; identity catalog still loads client-side via proxy in all modes. */
export type IdentityProvidersSettingsPageServerLoad = {
  readonly demo: boolean;
};

export async function loadIdentityProvidersSettingsPageData(): Promise<IdentityProvidersSettingsPageServerLoad> {
  const demo = isNextPublicDemoMode() || isStaticDemoPayloadFallbackEnabled();

  return { demo };
}
