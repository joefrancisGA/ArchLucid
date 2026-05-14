import { isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator-static-demo";

/** Admin directory payloads stay client-fetched only — server exposes demo routing parity without risking privileged prefetch before authority resolves. */
export type SettingsRolesPageServerLoad = {
  readonly demo: boolean;
};

export async function loadSettingsRolesPageData(): Promise<SettingsRolesPageServerLoad> {
  const demo = isNextPublicDemoMode() || isStaticDemoPayloadFallbackEnabled();

  return { demo };
}
