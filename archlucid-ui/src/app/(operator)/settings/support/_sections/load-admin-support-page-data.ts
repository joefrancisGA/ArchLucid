import { isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator-static-demo";

/** Support bundle download stays client-side; server only aligns demo routing with other operator surfaces. */
export type AdminSupportPageServerLoad = {
  readonly demo: boolean;
};

export async function loadAdminSupportPageData(): Promise<AdminSupportPageServerLoad> {
  const demo = isNextPublicDemoMode() || isStaticDemoPayloadFallbackEnabled();

  return { demo };
}
