import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const MODEL_GOVERNANCE_PROFILE_MAPPING_PROFILE_PARAM = "modelGovernanceProfileMappingProfile";

export function parseModelGovernanceProfileMappingProfileFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function modelGovernanceProfileMappingDisclosureHrefFromSearch(
  currentSearch: string,
  profile: string | null,
  pathname: string,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {
    const trimmed = (profile ?? "").trim();

    if (trimmed.length === 0) {
      params.delete(MODEL_GOVERNANCE_PROFILE_MAPPING_PROFILE_PARAM);
    } else {
      params.set(MODEL_GOVERNANCE_PROFILE_MAPPING_PROFILE_PARAM, trimmed);
    }
    },
  });
}
