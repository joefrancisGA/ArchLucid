import { isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator-static-demo";

/** Health payloads stay client-fetched; server only aligns demo routing with other operator surfaces. */
export type AdminHealthPageServerLoad = {
  readonly demo: boolean;
};

export async function loadAdminHealthPageData(): Promise<AdminHealthPageServerLoad> {
  const demo = isNextPublicDemoMode() || isStaticDemoPayloadFallbackEnabled();

  return { demo };
}
