import { canonicalizeLegacyOperatorRoutePath } from "@/lib/canonicalize-legacy-operator-route-path";
import { helpPageSituationTopicIds, type HelpPageSituation } from "@/lib/help/help-page-situation";
import { WORKING_HOME_HELP_SEARCH_EXCLUDED_TOPIC_IDS } from "@/lib/help/help-workspace-mode-copy";
import { collectHelpSearchPanelTopics } from "@/lib/help/help-search-panel-catalog-topics";
import {
  HELP_SEARCH_PANEL_MAX_RECOMMENDED,
} from "@/lib/help/help-search-panel-catalog";
import type { HelpSearchPanelTopic } from "@/lib/help/help-search-panel-catalog";

export const CORE_PILOT_NEXT_STEP_TOPIC_IDS: readonly string[] = [
  "create-first-review",
  "sample-review",
  "upload-evidence",
  "cloud-connections",
  "troubleshoot",
];

export const ROUTE_RECOMMENDED_TOPIC_IDS: readonly { readonly prefix: string; readonly topicIds: readonly string[] }[] = [
  { prefix: "/", topicIds: ["getting-started-help", "how-archlucid-works", "first-review-guide", "product-faq", "create-first-review"] },
  { prefix: "/architecture/first-review-guide", topicIds: ["how-archlucid-works", "first-review-guide", "product-faq", "create-first-review", "sample-review"] },
  { prefix: "/help/first-architecture-review", topicIds: CORE_PILOT_NEXT_STEP_TOPIC_IDS },
  { prefix: "/help", topicIds: ["getting-started-help", "how-archlucid-works", "choose-your-next-step", "first-review-guide", "product-faq", "cloud-connections", "data-handling-help", "security-trust-help", "troubleshoot"] },
  { prefix: "/pricing", topicIds: ["product-faq", "first-review-guide"] },
  { prefix: "/signup", topicIds: ["authentication-sign-in", "product-faq", "first-review-guide"] },
  { prefix: "/auth/signin", topicIds: ["authentication-sign-in"] },
  {
    prefix: "/integrations/cloud-connections",
    topicIds: ["cloud-connections", "connect-azure", "azure-permissions", "connect-aws", "connect-gcp", "troubleshoot"],
  },
  {
    prefix: "/administration/connection-status",
    topicIds: ["integration-readiness", "cloud-connections", "troubleshoot"],
  },
  { prefix: "/governance", topicIds: ["governance-workflow", "risk-register", "policy-packs"] },
  { prefix: "/governance/policy-packs", topicIds: ["policy-packs", "governance-workflow"] },
  { prefix: "/architecture/reviews/new", topicIds: ["create-first-review", "upload-evidence", "first-review-guide"] },
  { prefix: "/architecture/reviews", topicIds: ["review-findings", "finalize-review", "review-artifacts"] },
  { prefix: "/administration/users", topicIds: ["users-and-roles", "sso-identity"] },
  { prefix: "/settings/roles", topicIds: ["users-and-roles", "sso-identity"] },
  { prefix: "/administration/identity", topicIds: ["sso-identity", "users-and-roles"] },
];

export function normalizePathname(pathname: string): string {
  const withoutQuery = (pathname ?? "").split("?")[0] ?? "";
  const trimmed = withoutQuery.replace(/\/$/, "");
  const canonical = canonicalizeLegacyOperatorRoutePath(trimmed.length === 0 ? "/" : trimmed).split("?")[0] ?? trimmed;

  return canonical.length === 0 ? "/" : canonical;
}

export function helpSlugFromPath(path: string): string | null {
  if (!path.startsWith("/help/")) {
    return null;
  }

  const rest = path.slice("/help/".length);
  const slug = rest.split("/").find((segment) => segment.length > 0);

  return slug ?? null;
}

/** True when the recommendation would navigate to the page the drawer is already open on. */
export function helpSearchPanelTopicTargetsCurrentPage(
  topic: HelpSearchPanelTopic,
  pathname: string,
): boolean {
  if (topic.action.kind !== "route") {
    return false;
  }

  const path = normalizePathname(pathname);
  const href = normalizePathname(topic.action.href);

  if (href === path) {
    return true;
  }

  if (topic.action.helpSlug !== null && helpSlugFromPath(path) === topic.action.helpSlug) {
    return true;
  }

  return false;
}

/**
 * Surfaces where onboarding topics stay expanded: the marketing funnel, sign-in, and the
 * Help Center itself. Everywhere else the reader is already working inside the product.
 */
export const HELP_START_HERE_EXPANDED_PREFIXES: readonly string[] = [
  "/",
  "/help",
  "/faq",
  "/why",
  "/pricing",
  "/signup",
  "/auth",
  "/trust",
];

/** True when the Start here group should render collapsed behind a disclosure. */
export function shouldCollapseHelpStartHereGroup(pathname: string): boolean {
  const path = normalizePathname(pathname);

  return !HELP_START_HERE_EXPANDED_PREFIXES.some(
    (prefix) => path === prefix || (prefix !== "/" && path.startsWith(`${prefix}/`)),
  );
}

function filterWorkingHomeHelpTopicIds(topicIds: readonly string[], workingMode: boolean): string[] {
  if (!workingMode) {
    return [...topicIds];
  }

  const excluded = new Set(WORKING_HOME_HELP_SEARCH_EXCLUDED_TOPIC_IDS);

  return topicIds.filter((id) => !excluded.has(id));
}

export function recommendedHelpSearchPanelTopicIds(
  pathname: string,
  situation: HelpPageSituation | null = null,
  workingMode: boolean = false,
): string[] {
  const situationTopicIds = helpPageSituationTopicIds(situation);

  // A published situation describes the review in front of the user; it outranks the route.
  if (situationTopicIds.length > 0) {
    return filterWorkingHomeHelpTopicIds(situationTopicIds, workingMode);
  }

  const path = normalizePathname(pathname);

  if (path === "/") {
    const homeTopicIds = ROUTE_RECOMMENDED_TOPIC_IDS.find((row) => row.prefix === "/")?.topicIds ?? [];

    return filterWorkingHomeHelpTopicIds(homeTopicIds, workingMode);
  }

  const sorted = [...ROUTE_RECOMMENDED_TOPIC_IDS].sort((left, right) => right.prefix.length - left.prefix.length);

  for (const row of sorted) {
    if (row.prefix === "/") {
      continue;
    }

    if (path === row.prefix || path.startsWith(`${row.prefix}/`)) {
      return filterWorkingHomeHelpTopicIds(row.topicIds, workingMode);
    }
  }

  return [];
}

export function recommendedHelpSearchPanelTopics(
  pathname: string,
  isAdmin: boolean,
  situation: HelpPageSituation | null = null,
  workingMode: boolean = false,
): HelpSearchPanelTopic[] {
  const byId = new Map(collectHelpSearchPanelTopics(isAdmin).map((topic) => [topic.id, topic]));
  const ids = recommendedHelpSearchPanelTopicIds(pathname, situation, workingMode);

  return ids
    .map((id) => byId.get(id))
    .filter((topic): topic is HelpSearchPanelTopic => topic !== undefined)
    .filter((topic) => !helpSearchPanelTopicTargetsCurrentPage(topic, pathname))
    .slice(0, HELP_SEARCH_PANEL_MAX_RECOMMENDED);
}

/**
 * Elevate the first recommended topic as Do this now; keep the rest under Recommended (TB-1045).
 */
export function splitHelpSearchPanelDoThisNow(topics: readonly HelpSearchPanelTopic[]): {
  readonly doThisNow: HelpSearchPanelTopic | null;
  readonly moreRecommended: readonly HelpSearchPanelTopic[];
} {
  if (topics.length === 0) {
    return { doThisNow: null, moreRecommended: [] };
  }

  return {
    doThisNow: topics[0]!,
    moreRecommended: topics.slice(1),
  };
}
