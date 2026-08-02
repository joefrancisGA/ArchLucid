import { getExecDigestPreferences, tryGetTenantTrialStatus } from "@/lib/api";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator-static-demo";
import type { ExecDigestPreferencesResponse } from "@/types/exec-digest-preferences";
import type { TenantTrialStatusPayload } from "@/types/tenant-trial-status";

export type TenantSettingsHiddenLoad = {
  readonly mode: "hidden";
};

export type TenantSettingsVisibleLoad = {
  readonly mode: "visible";
  readonly trial: TenantTrialStatusPayload | null;
  readonly digest: ExecDigestPreferencesResponse | null;
  readonly digestLoadFailure: string | null;
};

export type TenantSettingsPageServerLoad = TenantSettingsHiddenLoad | TenantSettingsVisibleLoad;

export async function loadTenantSettingsPageData(): Promise<TenantSettingsPageServerLoad> {
  // Packaged/static demo builds have no live trial or digest API to back this page — hide it there only.
  // Buyer-polished vocabulary (see isBuyerPolishedOperatorShellEnv) governs copy/labels, not page visibility;
  // it must not gate this page, since it now defaults to true for every authenticated deploy (TB-643).
  const hidden = isNextPublicDemoMode() || isStaticDemoPayloadFallbackEnabled();

  if (hidden) {
    return { mode: "hidden" };
  }

  const trial = await tryGetTenantTrialStatus();

  try {
    const digest = await getExecDigestPreferences();

    return {
      mode: "visible",
      trial,
      digest,
      digestLoadFailure: null,
    };
  } catch (e: unknown) {
    return {
      mode: "visible",
      trial,
      digest: null,
      digestLoadFailure: toApiLoadFailure(e).message,
    };
  }
}
