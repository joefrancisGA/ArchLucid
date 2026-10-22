import { isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator/operator-static-demo";

export type TenantSettingsHiddenLoad = {
  readonly mode: "hidden";
};

export type TenantSettingsVisibleLoad = {
  readonly mode: "visible";
};

export type TenantSettingsPageServerLoad = TenantSettingsHiddenLoad | TenantSettingsVisibleLoad;

export async function loadTenantSettingsPageData(): Promise<TenantSettingsPageServerLoad> {
  // Packaged/static demo builds have no live trial API to back this page — hide it there only.
  // Buyer-polished vocabulary (see isBuyerPolishedOperatorShellEnv) governs copy/labels, not page visibility;
  // it must not gate this page, since it now defaults to true for every authenticated deploy (TB-643).
  const hidden = isNextPublicDemoMode() || isStaticDemoPayloadFallbackEnabled();

  if (hidden) {
    return { mode: "hidden" };
  }

  return { mode: "visible" };
}
