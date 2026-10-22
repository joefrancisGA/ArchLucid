import { INTERNAL_PLATFORM_BUNDLED_POLICY_PACKS_PATH } from "@/lib/internal-ops-route-paths";
import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";

export const PLATFORM_BUNDLED_POLICY_PACK_ACTIVATE_FILE_PARAM = "bundleActivateFile";
export const PLATFORM_BUNDLED_POLICY_PACK_ACTIVATE_MODE_PARAM = "bundleActivateMode";

export const PLATFORM_BUNDLED_POLICY_PACK_ACTIVATE_MODES = ["activate", "deactivate"] as const;

export type PlatformBundledPolicyPackActivateMode =
  (typeof PLATFORM_BUNDLED_POLICY_PACK_ACTIVATE_MODES)[number];

const PLATFORM_BUNDLED_POLICY_PACK_ACTIVATE_MODE_SET = new Set<string>(
  PLATFORM_BUNDLED_POLICY_PACK_ACTIVATE_MODES,
);

export type PlatformBundledPolicyPackActivationConfirmUrlState = {
  readonly bundleContentFile: string | null;
  readonly mode: PlatformBundledPolicyPackActivateMode | null;
};

export function parsePlatformBundledPolicyPackActivateFileFromSearch(
  raw: string | null | undefined,
): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function parsePlatformBundledPolicyPackActivateModeFromSearch(
  raw: string | null | undefined,
): PlatformBundledPolicyPackActivateMode | null {
  if (raw === null || raw === undefined) {
    return null;
  }

  const trimmed = raw.trim().toLowerCase();

  if (!PLATFORM_BUNDLED_POLICY_PACK_ACTIVATE_MODE_SET.has(trimmed)) {
    return null;
  }

  return trimmed as PlatformBundledPolicyPackActivateMode;
}

export function platformBundledPolicyPackActivationConfirmHrefFromSearch(
  currentSearch: string,
  state: PlatformBundledPolicyPackActivationConfirmUrlState,
  pathname: string = INTERNAL_PLATFORM_BUNDLED_POLICY_PACKS_PATH,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {
    const bundleContentFile = (state.bundleContentFile ?? "").trim();

    if (bundleContentFile.length === 0 || state.mode === null) {
      params.delete(PLATFORM_BUNDLED_POLICY_PACK_ACTIVATE_FILE_PARAM);
      params.delete(PLATFORM_BUNDLED_POLICY_PACK_ACTIVATE_MODE_PARAM);
    } else {
      params.set(PLATFORM_BUNDLED_POLICY_PACK_ACTIVATE_FILE_PARAM, bundleContentFile);
      params.set(PLATFORM_BUNDLED_POLICY_PACK_ACTIVATE_MODE_PARAM, state.mode);
    }
    },
  });
}
