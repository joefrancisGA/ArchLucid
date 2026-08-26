"use client";

import { cn } from "@/lib/utils";
import { ArrowLeft, ExternalLink, Search } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useOperatorNavAuthority } from "@/components/operator/OperatorNavAuthorityProvider";
import { HelpArticleLoadFailurePanel } from "@/components/help/HelpArticleLoadFailurePanel";
import { HelpArticleSkeleton } from "@/components/help/HelpArticleSkeleton";
import { HelpDrawerBuyerChrome } from "@/components/help/HelpDrawerBuyerChrome";
import { HelpDrawerContent } from "@/components/help/HelpDrawerContent";
import { focusHelpDrawerRow } from "@/components/help/help-drawer-list-keyboard";
import { HelpSearchPanelHeader } from "@/components/help/HelpSearchPanelHeader";
import { useHelpPageSituation } from "@/components/help/help-page-situation-store";
import { HELP_DRAWER_ROW_LIST_CLASS } from "@/components/help/help-drawer-row-class";
import { HelpDrawerDoThisNowRow } from "@/components/help/HelpDrawerDoThisNowRow";
import { HelpDrawerTopicRow } from "@/components/help/HelpDrawerTopicRow";
import { OperatorShellSupportQuickLinks } from "@/components/help/OperatorShellSupportQuickLinks";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { MarketingAccessibilityMarkdownFragment } from "@/components/marketing/MarketingAccessibilityMarkdownFragment";
import type { HelpTabId } from "@/components/HelpPanel";
import { ProductConceptsGlossaryDialog } from "@/components/usability/ProductConceptsGlossaryDialog";
import { UsabilityFeedbackWidget } from "@/components/usability/UsabilityFeedbackWidget";
import type { HelpArticleResponse } from "@/app/api/help/[slug]/route";
import {
  filterHelpSearchPanelTopics,
  HELP_ARTICLE_LOAD_RETRY_LABEL,
  HELP_SEARCH_PANEL_EMPTY_HINT,
  HELP_SEARCH_PANEL_EMPTY_TITLE,
  HELP_SEARCH_PANEL_KEYBOARD_HINT,
  HELP_SEARCH_PANEL_SEARCH_PLACEHOLDER,
  HELP_SEARCH_PANEL_SEARCHING_SUBTITLE,
  HELP_SEARCH_PANEL_START_HERE_COLLAPSED_SUMMARY,
  HELP_SEARCH_PANEL_START_HERE_GROUP_ID,
  HELP_SEARCH_PANEL_SUBTITLE,
  listHelpSearchPanelGroups,
  listHelpSearchPanelTopics,
  recommendedHelpSearchPanelTopics,
  shouldCollapseHelpStartHereGroup,
  splitHelpSearchPanelDoThisNow,
  type HelpSearchPanelAction,
  type HelpSearchPanelTopic,
} from "@/lib/help/help-search-panel-catalog";
import { type HelpDocSearchRecord, searchHelpDocumentation } from "@/lib/help/help-index";
import {
  HELP_ON_HELP_ON_THIS_PAGE_HEADING,
  HELP_ON_HELP_SEARCH_PLACEHOLDER,
  HELP_ON_HELP_SUBTITLE,
  helpDocRecordTargetsPath,
  isHelpOnHelpPath,
  listHelpOnHelpSectionAnchors,
  prioritizeHelpSearchHitsForCurrentPage,
} from "@/lib/help/help-on-help";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { getProductDocumentationEntry, inAppHelpHref } from "@/lib/product-documentation-registry";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { HelpDrawerDocHitRow, HelpDrawerGroupHeading } from "@/components/HelpSearchDrawerHits";
import {
  helpRecordHref,
  helpRecordSelectionValue,
  helpSlugFromHref,
} from "@/components/help-search-panel-hrefs";

export type HelpSearchPanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Opens the guides panel (parent-owned); optional tab lands on Keyboard shortcuts or Troubleshooting. */
  onOpenGuidesPanel?: (initialTab?: HelpTabId) => void;
};

type ArticleState =
  | { status: "idle" }
  | { status: "loading"; slug: string }
  | { status: "loaded"; article: HelpArticleResponse }
  | { status: "error"; slug: string };

/**
 * Right-side contextual help drawer: curated launcher, live search, and inline article reader.
 */
export function HelpSearchPanel({ open, onOpenChange, onOpenGuidesPanel }: HelpSearchPanelProps) {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const { callerAuthorityRank, isAuthorityLoading } = useOperatorNavAuthority();
  const isAdmin = !isAuthorityLoading && callerAuthorityRank >= AUTHORITY_RANK.AdminAuthority;

  const [query, setQuery] = useState("");
  const [highlightedRowId, setHighlightedRowId] = useState("");
  const [article, setArticle] = useState<ArticleState>({ status: "idle" });
  const [conceptsDialogOpen, setConceptsDialogOpen] = useState(false);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const topicListRef = useRef<HTMLDivElement>(null);

  const isSearching = query.trim().length > 0;
  const isViewingArticle = article.status === "loaded" || article.status === "loading" || article.status === "error";
  const helpOnHelp = isHelpOnHelpPath(pathname);

  const situation = useHelpPageSituation();
  const visibleGroups = useMemo(() => listHelpSearchPanelGroups(isAdmin), [isAdmin]);
  // Search spans situation topics too, which are deliberately absent from the browse groups.
  const allTopics = useMemo(() => listHelpSearchPanelTopics(isAdmin), [isAdmin]);
  const collapseStartHere = useMemo(() => shouldCollapseHelpStartHereGroup(pathname), [pathname]);
  const recommendedTopics = useMemo(
    () => recommendedHelpSearchPanelTopics(pathname, isAdmin, situation),
    [isAdmin, pathname, situation],
  );
  const { doThisNow, moreRecommended } = useMemo(
    () => splitHelpSearchPanelDoThisNow(recommendedTopics),
    [recommendedTopics],
  );
  const onThisPageAnchors = useMemo(
    () => (helpOnHelp ? listHelpOnHelpSectionAnchors(pathname) : []),
    [helpOnHelp, pathname],
  );
  const recommendedTopicIds = useMemo(
    () => new Set(recommendedTopics.map((topic) => topic.id)),
    [recommendedTopics],
  );
  const visibleGroupsWithoutRecommended = useMemo(
    () =>
      visibleGroups.map((group) => ({
        ...group,
        topics: group.topics.filter((topic) => !recommendedTopicIds.has(topic.id)),
      })),
    [recommendedTopicIds, visibleGroups],
  );
  const filteredTopics = useMemo(
    () => filterHelpSearchPanelTopics(allTopics, query),
    [allTopics, query],
  );
  const hits = useMemo(() => {
    if (!isSearching) {
      return [];
    }

    return prioritizeHelpSearchHitsForCurrentPage(searchHelpDocumentation(query), pathname);
  }, [isSearching, pathname, query]);

  const defaultHighlightedRowId = useMemo(() => {
    if (isSearching) {
      if (filteredTopics.length > 0) {
        return `search:${filteredTopics[0]!.id}`;
      }

      if (hits.length > 0) {
        return `doc:${helpRecordSelectionValue(hits[0]!)}`;
      }

      return "";
    }

    if (doThisNow !== null) {
      return `do-this-now:${doThisNow.id}`;
    }

    if (onThisPageAnchors.length > 0) {
      return `on-page:${helpRecordSelectionValue(onThisPageAnchors[0]!)}`;
    }

    if (moreRecommended.length > 0) {
      return `recommended:${moreRecommended[0]!.id}`;
    }

    const firstGroup = visibleGroupsWithoutRecommended.find((group) => group.topics.length > 0);
    const firstTopic = firstGroup?.topics[0];

    if (firstGroup !== undefined && firstTopic !== undefined) {
      return `group:${firstGroup.id}:${firstTopic.id}`;
    }

    return "";
  }, [
    doThisNow,
    filteredTopics,
    hits,
    isSearching,
    moreRecommended,
    onThisPageAnchors,
    visibleGroupsWithoutRecommended,
  ]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setHighlightedRowId("");
      setArticle({ status: "idle" });
      setConceptsDialogOpen(false);
      setFeedbackDialogOpen(false);
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [open]);

  useEffect(() => {
    setHighlightedRowId((current) => {
      if (current.length > 0) {
        return current;
      }

      return defaultHighlightedRowId;
    });
  }, [defaultHighlightedRowId]);

  const loadArticle = useCallback(async (slug: string) => {
    setArticle({ status: "loading", slug });

    try {
      const res = await fetch(`/api/help/${encodeURIComponent(slug)}`);

      if (!res.ok) {
        setArticle({ status: "error", slug });
        return;
      }

      const data = (await res.json()) as HelpArticleResponse;
      setArticle({ status: "loaded", article: data });
    } catch {
      setArticle({ status: "error", slug });
    }
  }, []);

  function openTopicAction(action: HelpSearchPanelAction): void {
    if (action.kind === "guides-panel") {
      onOpenChange(false);
      onOpenGuidesPanel?.(action.tab);
      return;
    }

    if (action.kind === "concepts-dialog") {
      setConceptsDialogOpen(true);
      return;
    }

    if (action.kind === "feedback-dialog") {
      setFeedbackDialogOpen(true);
      return;
    }

    openEntry(action.href, action.helpSlug);
  }

  function openTopic(topic: HelpSearchPanelTopic): void {
    openTopicAction(topic.action);
  }

  function openEntry(href: string, helpSlug: string | null): void {
    if (helpSlug !== null) {
      void loadArticle(helpSlug);
      return;
    }

    onOpenChange(false);
    router.push(href);
  }

  function openCurrentPageAnchor(record: HelpDocSearchRecord): void {
    onOpenChange(false);

    // Build-time help-index slugs are [a-z0-9-]+; reject anything else before touching location.hash.
    if (record.sectionSlug.length === 0 || !/^[a-z0-9-]+$/i.test(record.sectionSlug)) {
      return;
    }

    // Hash navigation keeps the open help page; HelpTopicHashScroll expands/scrolls the section.
    window.location.hash = record.sectionSlug;
  }

  function openSearchHit(record: HelpDocSearchRecord): void {
    if (helpOnHelp && helpDocRecordTargetsPath(record, pathname)) {
      openCurrentPageAnchor(record);
      return;
    }

    const href = helpRecordHref(record);
    const slug = helpSlugFromHref(href);

    if (slug !== null) {
      void loadArticle(slug);
      return;
    }

    onOpenChange(false);
    router.push(href);
  }

  function backToSearch(): void {
    setArticle({ status: "idle" });

    window.requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });
  }

  function openGuidesTab(tab: HelpTabId): void {
    onOpenChange(false);
    onOpenGuidesPanel?.(tab);
  }

  function handleTopicListKeyDown(event: React.KeyboardEvent<HTMLDivElement>): void {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      focusHelpDrawerRow(topicListRef.current, "next");
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      focusHelpDrawerRow(topicListRef.current, "prev");
    }
  }

  function handleSearchInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>): void {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      focusHelpDrawerRow(topicListRef.current, "first");
    }
  }

  const loadingSlug = article.status === "loading" ? article.slug : article.status === "error" ? article.slug : null;
  const browseSubtitle = isSearching
    ? HELP_SEARCH_PANEL_SEARCHING_SUBTITLE
    : helpOnHelp
      ? HELP_ON_HELP_SUBTITLE
      : HELP_SEARCH_PANEL_SUBTITLE;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange} modal={false}>
        <HelpDrawerContent
          data-testid="help-search-panel"
          closeAriaLabel="Close help"
          aria-label="Contextual help"
          modal={false}
          onPointerDownOutside={(event) => {
            // Contextual help stays open while the reader works the page behind it;
            // Esc and the close button remain the dismissal paths.
            event.preventDefault();
          }}
          onInteractOutside={(event) => {
            event.preventDefault();
          }}
          onOpenAutoFocus={(event) => {
            // Keep caret in search so the drawer opens ready to type (TB-1047).
            event.preventDefault();
            searchInputRef.current?.focus();
          }}
        >
          {isViewingArticle ? (
            <>
              <div className="flex shrink-0 items-center gap-2 border-b border-neutral-200 px-3 py-2.5 dark:border-neutral-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className={cn("h-7 gap-1.5 px-2", OPERATOR_TYPOGRAPHY.button)}
                  onClick={backToSearch}
                >
                  <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
                  Back
                </Button>
                {article.status === "loaded" ? (
                  <Link
                    href={inAppHelpHref(article.article.slug)}
                    className={cn(
                      "ml-auto flex items-center gap-1 text-neutral-500 underline-offset-2 hover:underline dark:text-neutral-400",
                      OPERATOR_LINK.optional,
                    )}
                    onClick={() => onOpenChange(false)}
                  >
                    Open full page
                    <ExternalLink className="h-3 w-3" aria-hidden />
                  </Link>
                ) : null}
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
                {article.status === "loading" ? <HelpArticleSkeleton /> : null}
                {article.status === "error" && loadingSlug !== null ? (
                  <HelpArticleLoadFailurePanel
                    slug={loadingSlug}
                    retryLabel={HELP_ARTICLE_LOAD_RETRY_LABEL}
                    testId="help-article-load-failure"
                    retryTestId="help-article-load-retry"
                    onRetry={() => {
                      void loadArticle(loadingSlug);
                    }}
                  />
                ) : null}
                {article.status === "loaded" && (
                  <article>
                    <h2
                      className={cn(
                        "m-0 mb-1 font-semibold text-neutral-900 dark:text-neutral-100",
                        OPERATOR_TYPOGRAPHY.sectionTitle,
                      )}
                    >
                      {article.article.title}
                    </h2>
                    <p
                      className={cn(
                        "m-0 mb-4 leading-snug text-neutral-500 dark:text-neutral-400",
                        OPERATOR_TYPOGRAPHY.helper,
                      )}
                    >
                      {article.article.summary}
                    </p>
                    <MarketingAccessibilityMarkdownFragment
                      markdownBody={article.article.markdown}
                      tableCaption={`${article.article.title} reference table`}
                      presentation="help"
                      sourceDocPath={getProductDocumentationEntry(article.article.slug)?.sourcePaths[0]}
                    />
                  </article>
                )}
              </div>
            </>
          ) : (
            <>
              <HelpSearchPanelHeader subtitle={browseSubtitle} />

              {!isViewingArticle ? (
                <div className="shrink-0 border-b border-neutral-200 px-5 pb-3 dark:border-neutral-800">
                  <HelpDrawerBuyerChrome />
                </div>
              ) : null}

              <div className="shrink-0 border-b border-neutral-200 px-5 py-3 dark:border-neutral-800">
                <label htmlFor="help-doc-search-input" className="sr-only">
                  Search help
                </label>
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400"
                    aria-hidden
                  />
                  <Input
                    ref={searchInputRef}
                    id="help-doc-search-input"
                    type="search"
                    placeholder={
                      helpOnHelp ? HELP_ON_HELP_SEARCH_PLACEHOLDER : HELP_SEARCH_PANEL_SEARCH_PLACEHOLDER
                    }
                    value={query}
                    onChange={(event) => {
                      setQuery(event.target.value);
                      setHighlightedRowId("");
                    }}
                    onKeyDown={handleSearchInputKeyDown}
                    aria-label="Search help"
                    className={cn(
                      "h-9 border-neutral-200 bg-white pl-8 font-normal text-neutral-900 shadow-none placeholder:text-neutral-400 focus-visible:ring-1 focus-visible:ring-teal-500 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100",
                      OPERATOR_TYPOGRAPHY.body,
                    )}
                  />
                </div>
              </div>

              <div
                ref={topicListRef}
                className="min-h-0 flex-1 overflow-y-auto px-3 py-3"
                role="navigation"
                aria-label="Help topics"
                onKeyDown={handleTopicListKeyDown}
              >
                {isSearching ? (
                  <>
                    {filteredTopics.length === 0 && hits.length === 0 ? (
                      <div
                        className={cn(
                          "px-4 py-8 text-left text-neutral-600 dark:text-neutral-300",
                          OPERATOR_TYPOGRAPHY.body,
                        )}
                        data-testid="help-search-empty-state"
                      >
                        <p className="m-0 font-medium text-neutral-900 dark:text-neutral-100">
                          {HELP_SEARCH_PANEL_EMPTY_TITLE}
                        </p>
                        <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.helper)}>{HELP_SEARCH_PANEL_EMPTY_HINT}</p>
                      </div>
                    ) : null}
                    {filteredTopics.length > 0 ? (
                      <section aria-labelledby="help-search-topics-heading">
                        <HelpDrawerGroupHeading id="help-search-topics-heading">Topics</HelpDrawerGroupHeading>
                        <ul className={HELP_DRAWER_ROW_LIST_CLASS}>
                          {filteredTopics.map((topic) => {
                            const rowId = `search:${topic.id}`;

                            return (
                              <HelpDrawerTopicRow
                                key={rowId}
                                topic={topic}
                                isHighlighted={highlightedRowId === rowId}
                                onActivate={openTopic}
                                onHighlight={() => {
                                  setHighlightedRowId(rowId);
                                }}
                              />
                            );
                          })}
                        </ul>
                      </section>
                    ) : null}
                    {hits.length > 0 ? (
                      <section aria-labelledby="help-search-documentation-heading">
                        <HelpDrawerGroupHeading id="help-search-documentation-heading">Documentation</HelpDrawerGroupHeading>
                        <ul className={HELP_DRAWER_ROW_LIST_CLASS}>
                          {hits.map((hit) => {
                            const rowId = `doc:${helpRecordSelectionValue(hit)}`;

                            return (
                              <HelpDrawerDocHitRow
                                key={rowId}
                                hit={hit}
                                isHighlighted={highlightedRowId === rowId}
                                onActivate={openSearchHit}
                                onHighlight={() => {
                                  setHighlightedRowId(rowId);
                                }}
                              />
                            );
                          })}
                        </ul>
                      </section>
                    ) : null}
                  </>
                ) : (
                  <div className="space-y-4">
                    {doThisNow !== null ? (
                      <HelpDrawerDoThisNowRow
                        topic={doThisNow}
                        isHighlighted={highlightedRowId === `do-this-now:${doThisNow.id}`}
                        onActivate={openTopic}
                        onHighlight={() => {
                          setHighlightedRowId(`do-this-now:${doThisNow.id}`);
                        }}
                      />
                    ) : null}
                    {onThisPageAnchors.length > 0 ? (
                      <section
                        aria-labelledby="help-search-on-this-page-heading"
                        data-testid="help-search-on-this-page"
                      >
                        <HelpDrawerGroupHeading id="help-search-on-this-page-heading">
                          {HELP_ON_HELP_ON_THIS_PAGE_HEADING}
                        </HelpDrawerGroupHeading>
                        <ul className={HELP_DRAWER_ROW_LIST_CLASS}>
                          {onThisPageAnchors.map((anchor) => {
                            const rowId = `on-page:${helpRecordSelectionValue(anchor)}`;

                            return (
                              <HelpDrawerDocHitRow
                                key={rowId}
                                hit={anchor}
                                isHighlighted={highlightedRowId === rowId}
                                onActivate={openCurrentPageAnchor}
                                onHighlight={() => {
                                  setHighlightedRowId(rowId);
                                }}
                              />
                            );
                          })}
                        </ul>
                      </section>
                    ) : null}
                    {moreRecommended.length > 0 ? (
                      <section
                        aria-labelledby="help-search-recommended-heading"
                        data-testid="help-search-recommended-group"
                      >
                        <HelpDrawerGroupHeading id="help-search-recommended-heading">
                          Recommended for this page
                        </HelpDrawerGroupHeading>
                        <ul className={HELP_DRAWER_ROW_LIST_CLASS}>
                          {moreRecommended.map((topic) => {
                            const rowId = `recommended:${topic.id}`;

                            return (
                              <HelpDrawerTopicRow
                                key={rowId}
                                topic={topic}
                                isHighlighted={highlightedRowId === rowId}
                                onActivate={openTopic}
                                onHighlight={() => {
                                  setHighlightedRowId(rowId);
                                }}
                              />
                            );
                          })}
                        </ul>
                      </section>
                    ) : null}
                    {visibleGroupsWithoutRecommended.map((group) => {
                      if (group.topics.length === 0) {
                        return null;
                      }

                      const headingId = `help-search-group-${group.id}-heading`;
                      const collapsed =
                        collapseStartHere && group.id === HELP_SEARCH_PANEL_START_HERE_GROUP_ID;
                      const heading = (
                        <HelpDrawerGroupHeading id={headingId}>{group.heading}</HelpDrawerGroupHeading>
                      );
                      const rows = (
                        <ul className={HELP_DRAWER_ROW_LIST_CLASS}>
                          {group.topics.map((topic) => {
                            const rowId = `group:${group.id}:${topic.id}`;

                            return (
                              <HelpDrawerTopicRow
                                key={rowId}
                                topic={topic}
                                isHighlighted={highlightedRowId === rowId}
                                onActivate={openTopic}
                                onHighlight={() => {
                                  setHighlightedRowId(rowId);
                                }}
                              />
                            );
                          })}
                        </ul>
                      );

                      return (
                        <section
                          key={group.id}
                          aria-labelledby={headingId}
                          data-testid={`help-search-group-${group.id}`}
                        >
                          {collapsed ? (
                            <details data-testid="help-search-start-here-disclosure">
                              <summary className="flex cursor-pointer items-center justify-between gap-2 rounded-md hover:bg-neutral-50 dark:hover:bg-neutral-900">
                                {heading}
                                <span
                                  className={cn(
                                    "pr-3 text-neutral-500 dark:text-neutral-400",
                                    OPERATOR_TYPOGRAPHY.helper,
                                  )}
                                >
                                  {HELP_SEARCH_PANEL_START_HERE_COLLAPSED_SUMMARY}
                                </span>
                              </summary>
                              {rows}
                            </details>
                          ) : (
                            <>
                              {heading}
                              {rows}
                            </>
                          )}
                        </section>
                      );
                    })}
                  </div>
                )}
              </div>

              <footer
                className="shrink-0 space-y-2 border-t border-neutral-200 px-5 py-3 dark:border-neutral-800"
                data-testid="help-search-panel-footer"
              >
                <p className={cn("m-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                  Need help?
                </p>
                <OperatorShellSupportQuickLinks onNavigate={() => onOpenChange(false)} />
                <p className={cn("m-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                  <button
                    type="button"
                    className={cn(
                      "font-medium underline-offset-2 hover:underline",
                      OPERATOR_LINK.optional,
                    )}
                    onClick={() => {
                      openGuidesTab("shortcuts");
                    }}
                  >
                    Keyboard shortcuts
                  </button>
                </p>
                <p
                  className={cn("m-0 text-neutral-600 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}
                  data-testid="help-search-keyboard-hint"
                >
                  {HELP_SEARCH_PANEL_KEYBOARD_HINT}
                </p>
              </footer>
            </>
          )}
        </HelpDrawerContent>
      </Dialog>
      <ProductConceptsGlossaryDialog
        open={conceptsDialogOpen}
        onOpenChange={setConceptsDialogOpen}
        showTrigger={false}
      />
      <UsabilityFeedbackWidget open={feedbackDialogOpen} onOpenChange={setFeedbackDialogOpen} showTrigger={false} />
    </>
  );
}
