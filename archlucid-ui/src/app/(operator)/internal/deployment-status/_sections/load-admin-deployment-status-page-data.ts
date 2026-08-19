import { isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator/operator-static-demo";

/** Demo flag only; live status payloads stay client-fetched like other admin surfaces. */
export type AdminDeploymentStatusPageServerLoad = {
  readonly demo: boolean;
};

export async function loadAdminDeploymentStatusPageData(): Promise<AdminDeploymentStatusPageServerLoad> {
  const demo = isNextPublicDemoMode() || isStaticDemoPayloadFallbackEnabled();

  return { demo };
}
