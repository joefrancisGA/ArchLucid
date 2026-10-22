import type { HelpDocSearchRecord } from "@/lib/help/help-index";
import {
  HELP_SEARCH_PANEL_SEARCHING_SUBTITLE,
  HELP_SEARCH_PANEL_SUBTITLE,
  HELP_SEARCH_PANEL_START_HERE_GROUP_ID,
  type HelpSearchPanelTopic,
} from "@/lib/help/help-search-panel-catalog";
import {
  HELP_ON_HELP_SUBTITLE,
  listHelpOnHelpSectionAnchors,
} from "@/lib/help/help-on-help";
import type { HelpArticleResponse } from "@/app/api/help/[slug]/route";
import {
  helpRecordSelectionValue,
} from "@/components/help-search-panel-hrefs";

export type HelpSearchPanelArticleState =
  | { status: "idle" }
  | { status: "loading"; slug: string }
  | { status: "loaded"; article: HelpArticleResponse }
  | { status: "error"; slug: string };

export function resolveHelpSearchPanelBrowseSubtitle(options: {
  readonly isSearching: boolean;
  readonly helpOnHelp: boolean;
}): string {
  if (options.isSearching) {
    return HELP_SEARCH_PANEL_SEARCHING_SUBTITLE;
  }

  return options.helpOnHelp ? HELP_ON_HELP_SUBTITLE : HELP_SEARCH_PANEL_SUBTITLE;
}

export function resolveHelpSearchPanelLoadingSlug(
  article: HelpSearchPanelArticleState,
): string | null {
  if (article.status === "loading") {
    return article.slug;
  }

  if (article.status === "error") {
    return article.slug;
  }

  return null;
}

export function resolveHelpSearchPanelDefaultHighlightedRowId(options: {
  readonly isSearching: boolean;
  readonly filteredTopics: readonly HelpSearchPanelTopic[];
  readonly hits: readonly HelpDocSearchRecord[];
  readonly doThisNow: HelpSearchPanelTopic | null;
  readonly onThisPageAnchors: readonly HelpDocSearchRecord[];
  readonly moreRecommended: readonly HelpSearchPanelTopic[];
  readonly visibleGroupsWithoutRecommended: ReadonlyArray<{
    readonly id: string;
    readonly topics: readonly HelpSearchPanelTopic[];
  }>;
}): string {
  if (options.isSearching) {
    if (options.filteredTopics.length > 0) {
      return `search:${options.filteredTopics[0]!.id}`;
    }

    if (options.hits.length > 0) {
      return `doc:${helpRecordSelectionValue(options.hits[0]!)}`;
    }

    return "";
  }

  if (options.doThisNow !== null) {
    return `do-this-now:${options.doThisNow.id}`;
  }

  if (options.onThisPageAnchors.length > 0) {
    return `on-page:${helpRecordSelectionValue(options.onThisPageAnchors[0]!)}`;
  }

  if (options.moreRecommended.length > 0) {
    return `recommended:${options.moreRecommended[0]!.id}`;
  }

  const firstGroup = options.visibleGroupsWithoutRecommended.find((group) => group.topics.length > 0);
  const firstTopic = firstGroup?.topics[0];

  if (firstGroup !== undefined && firstTopic !== undefined) {
    return `group:${firstGroup.id}:${firstTopic.id}`;
  }

  return "";
}

export function listHelpSearchPanelOnThisPageAnchors(
  helpOnHelp: boolean,
  pathname: string,
): readonly HelpDocSearchRecord[] {
  return helpOnHelp ? listHelpOnHelpSectionAnchors(pathname) : [];
}

export { HELP_SEARCH_PANEL_START_HERE_GROUP_ID };
