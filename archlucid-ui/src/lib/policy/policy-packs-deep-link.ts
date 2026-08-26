import { GOVERNANCE_POLICY_PACKS_PATH } from "@/lib/governance/governance-route-paths";
import { POLICY_PACKS_REVIEW_ID_QUERY_PARAM } from "@/lib/policy-packs-review-handoff";

/** Query param used by governance conflict links to pre-select a pack on the policy packs hub. */

export const POLICY_PACK_ID_QUERY_PARAM = "packId";

/** Query param used by alert inbox deep links to focus a policy or alert rule on the policy packs hub. */

export const POLICY_RULE_ID_QUERY_PARAM = "ruleId";

/** Primary section tab on the policy packs hub (`my-packs`, `catalog`, `generator`, `author`). */

export const POLICY_PACKS_TAB_QUERY_PARAM = "tab";

export function policyPacksGeneratorHref(): string {

  const params = new URLSearchParams();

  params.set(POLICY_PACKS_TAB_QUERY_PARAM, "generator");

  return `${GOVERNANCE_POLICY_PACKS_PATH}?${params.toString()}`;

}

export function policyPacksEditHref(policyPackId: string): string {

  const id = policyPackId.trim();

  if (id.length === 0) {

    return GOVERNANCE_POLICY_PACKS_PATH;

  }

  const params = new URLSearchParams();

  params.set(POLICY_PACK_ID_QUERY_PARAM, id);

  return `${GOVERNANCE_POLICY_PACKS_PATH}?${params.toString()}`;

}

/** First-class policy pack detail route with optional review scope. */
export function policyPackDetailHref(policyPackId: string, reviewId?: string | null): string {
  const id = policyPackId.trim();

  if (id.length === 0) {
    return GOVERNANCE_POLICY_PACKS_PATH;
  }

  const path = `${GOVERNANCE_POLICY_PACKS_PATH}/${encodeURIComponent(id)}`;
  const review = reviewId?.trim() ?? "";

  if (review.length === 0) {
    return path;
  }

  const params = new URLSearchParams();
  params.set(POLICY_PACKS_REVIEW_ID_QUERY_PARAM, review);

  return `${path}?${params.toString()}`;
}

/** Opens the first-class rule authoring tab with optional pack and rule focus. */

export function policyPacksAuthorHref(policyPackId?: string, ruleId?: string): string {

  const params = new URLSearchParams();

  params.set(POLICY_PACKS_TAB_QUERY_PARAM, "author");

  const pack = policyPackId?.trim() ?? "";

  if (pack.length > 0) {

    params.set(POLICY_PACK_ID_QUERY_PARAM, pack);

  }

  const rule = ruleId?.trim() ?? "";

  if (rule.length > 0) {

    params.set(POLICY_RULE_ID_QUERY_PARAM, rule);

  }

  return `${GOVERNANCE_POLICY_PACKS_PATH}?${params.toString()}`;

}

export function policyPacksRuleHref(ruleId: string): string {

  const id = ruleId.trim();

  if (id.length === 0) {

    return GOVERNANCE_POLICY_PACKS_PATH;

  }

  const params = new URLSearchParams();

  params.set(POLICY_RULE_ID_QUERY_PARAM, id);

  return `${GOVERNANCE_POLICY_PACKS_PATH}?${params.toString()}`;

}

/** Opens the new-review wizard with a pre-selected policy pack. */
export function reviewsNewWithPackHref(policyPackId: string): string {
  const id = policyPackId.trim();

  if (id.length === 0) {
    return "/architecture/reviews/new";
  }

  const params = new URLSearchParams();
  params.set(POLICY_PACK_ID_QUERY_PARAM, id);

  return `/architecture/reviews/new?${params.toString()}`;
}

