import { GOVERNANCE_POLICY_PACKS_PATH } from "@/lib/governance/governance-route-paths";
import { asNonemptyReadonlyArray } from "@/lib/continue-last-list-guard";
import { OPERATOR_RECENT_VIEWS_STORAGE_KEY, parseStoredRecentViews } from "@/lib/operator/operator-recent-views";
import { POLICY_PACK_ID_QUERY_PARAM } from "@/lib/policy/policy-packs-deep-link";
import type { PolicyPack } from "@/types/policy-packs";

const POLICY_PACKS_DETAIL_PREFIX = `${GOVERNANCE_POLICY_PACKS_PATH}/`;

export type ContinueLastPolicyPackSource = "recent-view" | "recency-fallback";

export type ResolvedContinueLastPolicyPack = {
  readonly pack: PolicyPack;
  readonly source: ContinueLastPolicyPackSource;
  readonly viewedAtUtc: string | null;
};

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

function readRecentPolicyPackView(): { readonly policyPackId: string; readonly viewedAtUtc: string } | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(OPERATOR_RECENT_VIEWS_STORAGE_KEY);
    const state = parseStoredRecentViews(raw);

    for (const entry of state.entries) {
      const policyPackId = policyPackIdFromRecentHref(entry.href);

      if (policyPackId !== null) {
        return { policyPackId, viewedAtUtc: entry.visitedAtUtc };
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
export function resolveContinueLastPolicyPackDetail(packs: unknown): ResolvedContinueLastPolicyPack | null {
  const normalizedPacks = asNonemptyReadonlyArray<PolicyPack>(packs);

  if (normalizedPacks === null) {
    return null;
  }

  const validPacks = normalizedPacks.filter(
    (pack) =>
      typeof pack?.policyPackId === "string"
      && typeof pack?.createdUtc === "string"
      && (pack?.activatedUtc == null || typeof pack.activatedUtc === "string"),
  );

  if (validPacks.length === 0) {
    return null;
  }

  const recentView = readRecentPolicyPackView();

  if (recentView !== null) {
    const recentMatch = validPacks.find((pack) => pack.policyPackId === recentView.policyPackId);

    if (recentMatch !== undefined) {
      return {
        pack: recentMatch,
        source: "recent-view",
        viewedAtUtc: recentView.viewedAtUtc,
      };
    }
  }

  const fallbackPack =
    validPacks
      .slice()
      .sort((left, right) => policyPackRecencyUtc(right).localeCompare(policyPackRecencyUtc(left)))[0] ?? null;

  if (fallbackPack === null) {
    return null;
  }

  return {
    pack: fallbackPack,
    source: "recency-fallback",
    viewedAtUtc: null,
  };
}

export function resolveContinueLastPolicyPack(packs: unknown): PolicyPack | null {
  return resolveContinueLastPolicyPackDetail(packs)?.pack ?? null;
}
