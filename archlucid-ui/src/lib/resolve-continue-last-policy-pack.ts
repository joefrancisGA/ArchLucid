import { GOVERNANCE_POLICY_PACKS_PATH } from "@/lib/governance/governance-route-paths";
import { OPERATOR_RECENT_VIEWS_STORAGE_KEY, parseStoredRecentViews } from "@/lib/operator/operator-recent-views";
import { POLICY_PACK_ID_QUERY_PARAM } from "@/lib/policy/policy-packs-deep-link";
import type { PolicyPack } from "@/types/policy-packs";

const POLICY_PACKS_DETAIL_PREFIX = `${GOVERNANCE_POLICY_PACKS_PATH}/`;

function policyPackIdFromRecentHref(href: string): string | null {
  const queryIndex = href.indexOf("?");

  if (queryIndex >= 0) {
    const search = href.slice(queryIndex);
    const params = new URLSearchParams(search);
    const packId = params.get(POLICY_PACK_ID_QUERY_PARAM);

    if (packId !== null && packId.trim().length > 0) {
      return packId.trim();
    }
  }

  const path = href.split("?")[0] ?? "";

  if (!path.startsWith(POLICY_PACKS_DETAIL_PREFIX)) {
    return null;
  }

  const remainder = path.slice(POLICY_PACKS_DETAIL_PREFIX.length).trim();

  if (remainder.length === 0 || remainder.includes("/")) {
    return null;
  }

  return remainder;
}

function readRecentPolicyPackId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(OPERATOR_RECENT_VIEWS_STORAGE_KEY);
    const state = parseStoredRecentViews(raw);

    for (const entry of state.entries) {
      const policyPackId = policyPackIdFromRecentHref(entry.href);

      if (policyPackId !== null) {
        return policyPackId;
      }
    }
  } catch {
    return null;
  }

  return null;
}

function policyPackRecencyUtc(pack: PolicyPack): string {
  return pack.activatedUtc ?? pack.createdUtc;
}

/** Resolves the policy pack to pin as Continue last viewed on the packs hub. */
export function resolveContinueLastPolicyPack(packs: readonly PolicyPack[]): PolicyPack | null {
  if (packs.length === 0) {
    return null;
  }

  const recentPolicyPackId = readRecentPolicyPackId();

  if (recentPolicyPackId !== null) {
    const recentMatch = packs.find((pack) => pack.policyPackId === recentPolicyPackId);

    if (recentMatch !== undefined) {
      return recentMatch;
    }
  }

  return (
    packs
      .slice()
      .sort((left, right) => policyPackRecencyUtc(right).localeCompare(policyPackRecencyUtc(left)))[0] ?? null
  );
}
