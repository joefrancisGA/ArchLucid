import { getExecDigestPreferences, tryGetTenantTrialStatus } from "@/lib/api";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { isBuyerPolishedOperatorShellEnv, isNextPublicDemoMode } from "@/lib/demo-ui-env";
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
  const hidden =
    isNextPublicDemoMode() || isStaticDemoPayloadFallbackEnabled() || isBuyerPolishedOperatorShellEnv();

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
