import { isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator-static-demo";

/** Configuration summary/lint stay client-fetched; server only aligns demo routing with other operator surfaces. */
export type AdminConfigurationPageServerLoad = {
  readonly demo: boolean;
};

export async function loadAdminConfigurationPageData(): Promise<AdminConfigurationPageServerLoad> {
  const demo = isNextPublicDemoMode() || isStaticDemoPayloadFallbackEnabled();

  return { demo };
}
