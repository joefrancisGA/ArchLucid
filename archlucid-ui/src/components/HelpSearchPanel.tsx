"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useOperatorNavAuthority } from "@/components/operator/OperatorNavAuthorityProvider";
import { HelpDrawerContent } from "@/components/help/HelpDrawerContent";
import { focusHelpDrawerRow } from "@/components/help/help-drawer-list-keyboard";
import { useHelpPageSituation } from "@/components/help/help-page-situation-store";
import { HelpSearchPanelInput } from "@/components/HelpSearchPanelInput";
import { HelpSearchPanelResults } from "@/components/HelpSearchPanelResults";
import { Dialog } from "@/components/ui/dialog";
import type { HelpTabId } from "@/components/HelpPanel";
import { ProductConceptsGlossaryDialog } from "@/components/usability/ProductConceptsGlossaryDialog";
import { UsabilityFeedbackWidget } from "@/components/usability/UsabilityFeedbackWidget";
import type { HelpArticleResponse } from "@/app/api/help/[slug]/route";
import {
  filterHelpSearchPanelTopics,
  listHelpSearchPanelGroups,
  listHelpSearchPanelTopics,
  recommendedHelpSearchPanelTopics,
  shouldCollapseHelpStartHereGroup,
  splitHelpSearchPanelDoThisNow,
  type HelpSearchPanelAction,
  type HelpSearchPanelTopic,
} from "@/lib/help/help-search-panel-catalog";
import { searchHelpDocumentation, type HelpDocSearchRecord } from "@/lib/help/help-index";
import {
  helpDocRecordTargetsPath,
  isHelpOnHelpPath,
  prioritizeHelpSearchHitsForCurrentPage,
} from "@/lib/help/help-on-help";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import {
  helpRecordHref,
  helpSlugFromHref,
} from "@/components/help-search-panel-hrefs";
import {
  listHelpSearchPanelOnThisPageAnchors,
  resolveHelpSearchPanelBrowseSubtitle,
  resolveHelpSearchPanelDefaultHighlightedRowId,
  resolveHelpSearchPanelLoadingSlug,
  type HelpSearchPanelArticleState,
} from "@/components/help-search-panel-presentation";

export type HelpSearchPanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Opens the guides panel (parent-owned); optional tab lands on Keyboard shortcuts or Troubleshooting. */
  onOpenGuidesPanel?: (initialTab?: HelpTabId) => void;
};

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
  const [article, setArticle] = useState<HelpSearchPanelArticleState>({ status: "idle" });
  const [conceptsDialogOpen, setConceptsDialogOpen] = useState(false);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const topicListRef = useRef<HTMLDivElement>(null);

  const isSearching = query.trim().length > 0;
  const isViewingArticle = article.status === "loaded" || article.status === "loading" || article.status === "error";
  const helpOnHelp = isHelpOnHelpPath(pathname);

  const situation = useHelpPageSituation();
  const visibleGroups = useMemo(() => listHelpSearchPanelGroups(isAdmin), [isAdmin]);
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
    () => listHelpSearchPanelOnThisPageAnchors(helpOnHelp, pathname),
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

  const defaultHighlightedRowId = useMemo(
    () =>
      resolveHelpSearchPanelDefaultHighlightedRowId({
        isSearching,
        filteredTopics,
        hits,
        doThisNow,
        onThisPageAnchors,
        moreRecommended,
        visibleGroupsWithoutRecommended,
      }),
    [
      doThisNow,
      filteredTopics,
      hits,
      isSearching,
      moreRecommended,
      onThisPageAnchors,
      visibleGroupsWithoutRecommended,
    ],
  );

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

    if (record.sectionSlug.length === 0 || !/^[a-z0-9-]+$/i.test(record.sectionSlug)) {
      return;
    }

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

  const loadingSlug = resolveHelpSearchPanelLoadingSlug(article);
  const browseSubtitle = resolveHelpSearchPanelBrowseSubtitle({ isSearching, helpOnHelp });

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange} modal={false}>
        <HelpDrawerContent
          data-testid="help-search-panel"
          closeAriaLabel="Close help"
          aria-label="Contextual help"
          modal={false}
          onPointerDownOutside={(event) => {
            event.preventDefault();
          }}
          onInteractOutside={(event) => {
            event.preventDefault();
          }}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            searchInputRef.current?.focus();
          }}
        >
          <HelpSearchPanelInput
            isViewingArticle={isViewingArticle}
            browseSubtitle={browseSubtitle}
            helpOnHelp={helpOnHelp}
            query={query}
            onQueryChange={(value) => {
              setQuery(value);
              setHighlightedRowId("");
            }}
            onSearchInputKeyDown={handleSearchInputKeyDown}
            searchInputRef={searchInputRef}
            article={article}
            loadingSlug={loadingSlug}
            onBackToSearch={backToSearch}
            onOpenChange={onOpenChange}
            onRetryArticleLoad={(slug) => {
              void loadArticle(slug);
            }}
          />
          {!isViewingArticle ? (
            <HelpSearchPanelResults
              isSearching={isSearching}
              filteredTopics={filteredTopics}
              hits={hits}
              highlightedRowId={highlightedRowId}
              onHighlightRow={setHighlightedRowId}
              onOpenTopic={openTopic}
              onOpenSearchHit={openSearchHit}
              doThisNow={doThisNow}
              onThisPageAnchors={onThisPageAnchors}
              onOpenCurrentPageAnchor={openCurrentPageAnchor}
              moreRecommended={moreRecommended}
              visibleGroupsWithoutRecommended={visibleGroupsWithoutRecommended}
              collapseStartHere={collapseStartHere}
              topicListRef={topicListRef}
              onTopicListKeyDown={handleTopicListKeyDown}
              onOpenChange={onOpenChange}
              onOpenGuidesTab={openGuidesTab}
            />
          ) : null}
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
