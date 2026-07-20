import { isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator-static-demo";

export type AdminDeploymentStatusPageServerLoad = {
  readonly demo: boolean;
};

export async function loadAdminDeploymentStatusPageData(): Promise<AdminDeploymentStatusPageServerLoad> {
  const demo = isNextPublicDemoMode() || isStaticDemoPayloadFallbackEnabled();

  return { demo };
}
