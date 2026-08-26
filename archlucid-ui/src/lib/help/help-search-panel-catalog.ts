import type { HelpTabId } from "@/components/HelpPanel";
import { REVIEW_TERMINOLOGY_BANNED_OPERATOR_PATTERNS } from "@/lib/review-terminology-surfaces";

import {
  ADVANCED_ADMIN_TOPICS,
  HELP_DRAWER_SEARCH_ALIASES,
  HELP_SEARCH_PANEL_GROUPS,
  collectHelpSearchPanelTopics,
} from "@/lib/help/help-search-panel-catalog-topics";

export const HELP_SEARCH_PANEL_TITLE = "Help" as const;

/** Says what the drawer gets you; the search placeholder already describes the input. */
export const HELP_SEARCH_PANEL_SUBTITLE =
  "Find the next step for what you are working on." as const;

export const HELP_ARTICLE_LOAD_RETRY_LABEL = "Try again" as const;

export const HELP_ARTICLE_LOADING_STATUS = "Loading topic…" as const;

export const HELP_SEARCH_PANEL_SEARCHING_SUBTITLE = "Showing matching guides and topics." as const;

export const HELP_SEARCH_PANEL_SEARCH_PLACEHOLDER = "Search guides, topics, or shortcuts…" as const;

export const HELP_SEARCH_PANEL_EMPTY_TITLE = "No help topics found" as const;

export const HELP_SEARCH_PANEL_EMPTY_HINT =
  "Try searching for review, evidence, findings, approval, SSO, or export." as const;

export const HELP_SEARCH_PANEL_KEYBOARD_HINT = "↑↓ Navigate · Enter Open · Esc Close" as const;

/** Cap for “Recommended for this page” before Do-this-now split (TB-1045). */
export const HELP_SEARCH_PANEL_MAX_RECOMMENDED = 3 as const;

/** Primary next-step heading above the first recommended topic (TB-1045). */
export const HELP_SEARCH_PANEL_DO_THIS_NOW_HEADING = "Do this now" as const;

/**
 * Footer label for the guides troubleshooting tab. Names the destination (guides plus a
 * diagnostic bundle) rather than promising a contact channel the button does not open.
 */
export const HELP_SEARCH_PANEL_SUPPORT_FOOTER_LABEL = "Contact support" as const;

/** Summary shown when the onboarding group is collapsed on a signed-in product surface. */
export const HELP_SEARCH_PANEL_START_HERE_COLLAPSED_SUMMARY = "New to ArchLucid?" as const;

export type HelpSearchPanelAction =
  | { readonly kind: "route"; readonly href: string; readonly helpSlug: string | null }
  | { readonly kind: "guides-panel"; readonly tab: HelpTabId }
  | { readonly kind: "concepts-dialog" }
  | { readonly kind: "feedback-dialog" };

export type HelpSearchPanelTopic = {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly keywords: readonly string[];
  readonly action: HelpSearchPanelAction;
  readonly adminOnly?: boolean;
};

export type HelpSearchPanelGroup = {
  readonly id: string;
  readonly heading: string;
  readonly topics: readonly HelpSearchPanelTopic[];
};

export {
  HELP_DRAWER_SEARCH_ALIASES,
  HELP_SEARCH_PANEL_GROUPS,
  HELP_SEARCH_PANEL_START_HERE_GROUP_ID,
} from "@/lib/help/help-search-panel-catalog-topics";

export {
  helpSearchPanelTopicTargetsCurrentPage,
  helpSlugFromPath,
  normalizePathname,
  recommendedHelpSearchPanelTopicIds,
  recommendedHelpSearchPanelTopics,
  shouldCollapseHelpStartHereGroup,
  splitHelpSearchPanelDoThisNow,
} from "@/lib/help/help-search-panel-catalog-recommend";

export function listHelpSearchPanelTopics(isAdmin: boolean): HelpSearchPanelTopic[] {
  return collectHelpSearchPanelTopics(isAdmin);
}

export function listHelpSearchPanelGroups(isAdmin: boolean): HelpSearchPanelGroup[] {
  const groups = HELP_SEARCH_PANEL_GROUPS.map((group) => ({
    ...group,
    topics: group.topics.filter((topic) => topic.adminOnly !== true || isAdmin),
  }));

  if (isAdmin) {
    return [
      ...groups,
      {
        id: "advanced-administration",
        heading: "Advanced administration",
        topics: ADVANCED_ADMIN_TOPICS,
      },
    ];
  }

  return groups;
}

function topicMatchesQuery(topic: HelpSearchPanelTopic, normalizedQuery: string): boolean {
  const haystack = `${topic.title} ${topic.description} ${topic.keywords.join(" ")}`.toLowerCase();

  if (haystack.includes(normalizedQuery)) {
    return true;
  }

  for (const [alias, topicIds] of Object.entries(HELP_DRAWER_SEARCH_ALIASES)) {
    if (!normalizedQuery.includes(alias)) {
      continue;
    }

    if (topicIds.includes(topic.id)) {
      return true;
    }
  }

  return false;
}

export function filterHelpSearchPanelTopics(
  topics: readonly HelpSearchPanelTopic[],
  query: string,
): HelpSearchPanelTopic[] {
  const normalizedQuery = query.trim().toLowerCase();

  if (normalizedQuery.length === 0) {
    return [...topics];
  }

  return topics.filter((topic) => topicMatchesQuery(topic, normalizedQuery));
}

const HELP_SEARCH_PANEL_EXTRA_BANNED_PUBLIC_COPY = [
  "engineering runbook",
  "permission regression",
] as const;

/** Returns true when copy contains banned default user-facing help phrases. */
export function helpSearchPanelTopicHasBannedPublicCopy(topic: HelpSearchPanelTopic): boolean {
  const corpus = `${topic.title} ${topic.description}`.toLowerCase();

  return (
    REVIEW_TERMINOLOGY_BANNED_OPERATOR_PATTERNS.some((pattern) => corpus.includes(pattern))
    || HELP_SEARCH_PANEL_EXTRA_BANNED_PUBLIC_COPY.some((pattern) => corpus.includes(pattern))
  );
}

/** Returns duplicate titles in the Help drawer catalog (case-insensitive). Empty when titles are unique (TB-1047). */
export function listDuplicateHelpSearchPanelTopicTitles(isAdmin: boolean): string[] {
  const counts = new Map<string, number>();

  for (const topic of listHelpSearchPanelTopics(isAdmin)) {
    const key = topic.title.trim().toLowerCase();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([title]) => title)
    .sort((left, right) => left.localeCompare(right));
}
