import { isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator-static-demo";

/** Configuration summary stays client-fetched behind session auth; server aligns demo routing without prefetch. */
export type IdentityProvidersSettingsPageServerLoad = {
  readonly demo: boolean;
};

export async function loadIdentityProvidersSettingsPageData(): Promise<IdentityProvidersSettingsPageServerLoad> {
  const demo = isNextPublicDemoMode() || isStaticDemoPayloadFallbackEnabled();

  return { demo };
}
