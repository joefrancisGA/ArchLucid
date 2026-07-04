"use client";

import { cn } from "@/lib/utils";
import { ArrowLeft, ChevronRight, ExternalLink } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useOperatorNavAuthority } from "@/components/OperatorNavAuthorityProvider";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MarketingAccessibilityMarkdownFragment } from "@/components/marketing/MarketingAccessibilityMarkdownFragment";
import type { HelpTabId } from "@/components/HelpPanel";
import { ProductConceptsGlossaryDialog } from "@/components/usability/ProductConceptsGlossaryDialog";
import { UsabilityFeedbackWidget } from "@/components/usability/UsabilityFeedbackWidget";
import type { HelpArticleResponse } from "@/app/api/help/[slug]/route";
import {
  filterHelpSearchPanelTopics,
  HELP_SEARCH_PANEL_EMPTY_HINT,
  HELP_SEARCH_PANEL_EMPTY_TITLE,
  HELP_SEARCH_PANEL_KEYBOARD_HINT,
  HELP_SEARCH_PANEL_SEARCH_PLACEHOLDER,
  HELP_SEARCH_PANEL_SEARCHING_SUBTITLE,
  HELP_SEARCH_PANEL_SUBTITLE,
  listHelpSearchPanelGroups,
  recommendedHelpSearchPanelTopics,
  type HelpSearchPanelAction,
  type HelpSearchPanelTopic,
} from "@/lib/help-search-panel-catalog";
import { type HelpDocSearchRecord, searchHelpDocumentation } from "@/lib/help-index";
import { resolveInAppDocHref } from "@/lib/in-app-doc-href";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { getProductDocumentationEntry, inAppHelpHref } from "@/lib/product-documentation-registry";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

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

function helpSlugFromHref(href: string): string | null {
  const match = /^\/help\/([^#?]+)/.exec(href);

  return match?.[1] ?? null;
}

function helpRecordHref(record: HelpDocSearchRecord): string {
  const path = record.docPath.startsWith("/") ? record.docPath : `/${record.docPath}`;
  const hash = record.sectionSlug.length > 0 ? `#${record.sectionSlug}` : "";

  return resolveInAppDocHref(`${path}${hash}`);
}

function helpRecordSelectionValue(record: HelpDocSearchRecord): string {
  return `${record.docPath}::${record.sectionSlug || "root"}::${record.sectionHeading}`;
}

function stripMdLinks(text: string): string {
  return text.replace(/\[([^\]]+)\]\(([^)]*)\)/g, "$1");
}

function HelpTopicRow({
  topic,
  selectionValue,
  onActivate,
  onHighlight,
}: {
  readonly topic: HelpSearchPanelTopic;
  readonly selectionValue: string;
  readonly onActivate: (topic: HelpSearchPanelTopic) => void;
  readonly onHighlight: (selectionValue: string) => void;
}): React.JSX.Element {
  return (
    <CommandItem
      value={selectionValue}
      keywords={[topic.title, topic.description, ...topic.keywords]}
      className="group flex cursor-pointer items-start gap-3 rounded-md border border-transparent px-3 py-3 aria-selected:border-neutral-300 aria-selected:bg-[var(--al-layer-hover)] dark:aria-selected:border-neutral-600 dark:aria-selected:bg-neutral-800/80"
      onPointerDown={() => onHighlight(selectionValue)}
      onPointerEnter={() => onHighlight(selectionValue)}
      onSelect={() => onActivate(topic)}
    >
      <span className="min-w-0 flex-1">
        <span
          className={cn(
            "block font-semibold text-neutral-900 dark:text-neutral-100",
            OPERATOR_TYPOGRAPHY.body,
          )}
        >
          {topic.title}
        </span>
        <span
          className={cn(
            "mt-1 block leading-snug text-neutral-600 dark:text-neutral-400",
            OPERATOR_TYPOGRAPHY.helper,
          )}
        >
          {topic.description}
        </span>
      </span>
      <ChevronRight
        className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400 opacity-70 transition-opacity group-aria-selected:opacity-100 dark:text-neutral-500"
        aria-hidden
      />
    </CommandItem>
  );
}

/**
 * Slide-over documentation search and inline reader.
 * Empty state: curated help launcher. After typing: indexed search results.
 * Help topics open inline; app routes navigate.
 */
export function HelpSearchPanel({ open, onOpenChange, onOpenGuidesPanel }: HelpSearchPanelProps) {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const { callerAuthorityRank, isAuthorityLoading } = useOperatorNavAuthority();
  const isAdmin = !isAuthorityLoading && callerAuthorityRank >= AUTHORITY_RANK.AdminAuthority;

  const [query, setQuery] = useState("");
  const [activeValue, setActiveValue] = useState("");
  const [article, setArticle] = useState<ArticleState>({ status: "idle" });
  const [conceptsDialogOpen, setConceptsDialogOpen] = useState(false);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const isSearching = query.trim().length > 0;
  const isViewingArticle = article.status === "loaded" || article.status === "loading" || article.status === "error";

  const visibleGroups = useMemo(() => listHelpSearchPanelGroups(isAdmin), [isAdmin]);
  const allTopics = useMemo(
    () => visibleGroups.flatMap((group) => group.topics),
    [visibleGroups],
  );
  const recommendedTopics = useMemo(
    () => recommendedHelpSearchPanelTopics(pathname, isAdmin),
    [isAdmin, pathname],
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
  const hits = useMemo(() => (isSearching ? searchHelpDocumentation(query) : []), [isSearching, query]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setActiveValue("");
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
    if (!isSearching) {
      const firstRecommended = recommendedTopics[0];
      const firstGroup = visibleGroupsWithoutRecommended.find((group) => group.topics.length > 0);
      const firstGroupTopic = firstGroup?.topics[0];

      if (firstRecommended !== undefined) {
        setActiveValue(`recommended:${firstRecommended.id}`);
        return;
      }

      if (firstGroupTopic !== undefined && firstGroup !== undefined) {
        setActiveValue(`group:${firstGroup.id}:${firstGroupTopic.id}`);
        return;
      }

      setActiveValue("");
      return;
    }

    if (filteredTopics.length === 0 && hits.length === 0) {
      setActiveValue("");
      return;
    }

    const firstValue =
      filteredTopics.length > 0
        ? `search:${filteredTopics[0]!.id}`
        : helpRecordSelectionValue(hits[0]!);

    setActiveValue((current) => {
      if (filteredTopics.some((topic) => current === `search:${topic.id}`)) {
        return current;
      }

      if (hits.some((hit) => helpRecordSelectionValue(hit) === current)) {
        return current;
      }

      return firstValue;
    });
  }, [filteredTopics, hits, isSearching, recommendedTopics, visibleGroupsWithoutRecommended]);

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

  function openSearchHit(record: HelpDocSearchRecord): void {
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
  }

  const loadingSlug = article.status === "loading" ? article.slug : article.status === "error" ? article.slug : null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          data-testid="help-search-panel"
          closeAriaLabel="Close help"
          className={cn(
            "fixed inset-y-0 right-0 top-0 z-[51] flex h-full max-h-none w-full max-w-md translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none border border-l-neutral-200 border-r-0 border-t-0 p-0 shadow-xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right sm:max-w-lg dark:border-l-neutral-700 dark:bg-neutral-950",
          )}
        >
          {isViewingArticle ? (
            <>
              <div className="flex shrink-0 items-center gap-2 border-b border-neutral-200 px-3 py-2.5 dark:border-neutral-800">
                <Button
                  type="button"
                  variant="ghost"
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
                {article.status === "loading" && (
                  <p className={cn("text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>Loading…</p>
                )}
                {article.status === "error" && (
                  <p className={cn("text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
                    Could not load this topic.{" "}
                    {loadingSlug !== null ? (
                      <Link
                        href={inAppHelpHref(loadingSlug)}
                        className="font-medium underline-offset-2 hover:underline"
                        onClick={() => onOpenChange(false)}
                      >
                        Open full page
                      </Link>
                    ) : null}
                  </p>
                )}
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
              <DialogHeader className="shrink-0 space-y-1 border-b border-neutral-200 px-4 pb-3 pt-4 text-left dark:border-neutral-800">
                <DialogTitle className="text-left text-lg text-neutral-900 dark:text-neutral-100">Help</DialogTitle>
                <DialogDescription className={cn("text-left", OPERATOR_TYPOGRAPHY.body)}>
                  {isSearching ? HELP_SEARCH_PANEL_SEARCHING_SUBTITLE : HELP_SEARCH_PANEL_SUBTITLE}
                </DialogDescription>
              </DialogHeader>

              <Command
                shouldFilter={false}
                value={activeValue}
                onValueChange={setActiveValue}
                className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-none border-0 bg-white dark:bg-neutral-950"
              >
                <label htmlFor="help-doc-search-input" className="sr-only">
                  Search help
                </label>
                <CommandInput
                  ref={searchInputRef}
                  id="help-doc-search-input"
                  placeholder={HELP_SEARCH_PANEL_SEARCH_PLACEHOLDER}
                  value={query}
                  onValueChange={setQuery}
                  aria-label="Search help"
                  autoFocus
                />

                <CommandList className="max-h-none flex-1 overflow-y-auto px-1 py-1" aria-label="Help topics">
                  {isSearching ? (
                    <>
                      {filteredTopics.length === 0 && hits.length === 0 ? (
                        <CommandEmpty
                          className={cn(
                            "px-4 py-8 text-left text-neutral-600 dark:text-neutral-300",
                            OPERATOR_TYPOGRAPHY.body,
                          )}
                        >
                          <p className="m-0 font-medium text-neutral-900 dark:text-neutral-100">
                            {HELP_SEARCH_PANEL_EMPTY_TITLE}
                          </p>
                          <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.helper)}>{HELP_SEARCH_PANEL_EMPTY_HINT}</p>
                        </CommandEmpty>
                      ) : null}
                      {filteredTopics.length > 0 ? (
                        <CommandGroup
                          heading="Topics"
                          className="px-0 [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:text-neutral-500 dark:[&_[cmdk-group-heading]]:text-neutral-400"
                        >
                          {filteredTopics.map((topic) => (
                            <HelpTopicRow
                              key={`search-${topic.id}`}
                              selectionValue={`search:${topic.id}`}
                              topic={topic}
                              onActivate={openTopic}
                              onHighlight={setActiveValue}
                            />
                          ))}
                        </CommandGroup>
                      ) : null}
                      {hits.length > 0 ? (
                        <CommandGroup
                          heading="Documentation"
                          className="px-0 [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:text-neutral-500 dark:[&_[cmdk-group-heading]]:text-neutral-400"
                        >
                          {hits.map((hit) => {
                            const selectionValue = helpRecordSelectionValue(hit);

                            return (
                              <CommandItem
                                key={selectionValue}
                                value={selectionValue}
                                keywords={[hit.docTitle, hit.sectionHeading, hit.excerpt]}
                                className="group flex cursor-pointer items-start gap-3 rounded-md border border-transparent px-3 py-3 aria-selected:border-neutral-300 aria-selected:bg-[var(--al-layer-hover)] dark:aria-selected:border-neutral-600 dark:aria-selected:bg-neutral-800/80"
                                onPointerDown={() => setActiveValue(selectionValue)}
                                onPointerEnter={() => setActiveValue(selectionValue)}
                                onSelect={() => openSearchHit(hit)}
                              >
                                <span className="min-w-0 flex-1">
                                  <span
                                    className={cn(
                                      "block font-semibold text-neutral-900 dark:text-neutral-100",
                                      OPERATOR_TYPOGRAPHY.body,
                                    )}
                                  >
                                    {hit.sectionHeading}
                                  </span>
                                  <span
                                    className={cn(
                                      "mt-1 block line-clamp-2 leading-snug text-neutral-600 dark:text-neutral-400",
                                      OPERATOR_TYPOGRAPHY.helper,
                                    )}
                                  >
                                    {stripMdLinks(hit.excerpt)}
                                  </span>
                                </span>
                                <ChevronRight
                                  className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400 opacity-70 transition-opacity group-aria-selected:opacity-100 dark:text-neutral-500"
                                  aria-hidden
                                />
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      ) : null}
                    </>
                  ) : (
                    <>
                      {recommendedTopics.length > 0 ? (
                        <CommandGroup
                          heading="Recommended for this page"
                          data-testid="help-search-recommended-group"
                          className="px-0 [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:text-neutral-500 dark:[&_[cmdk-group-heading]]:text-neutral-400"
                        >
                          {recommendedTopics.map((topic) => (
                            <HelpTopicRow
                              key={`recommended-${topic.id}`}
                              selectionValue={`recommended:${topic.id}`}
                              topic={topic}
                              onActivate={openTopic}
                              onHighlight={setActiveValue}
                            />
                          ))}
                        </CommandGroup>
                      ) : null}
                      {visibleGroupsWithoutRecommended.map((group) =>
                        group.topics.length === 0 ? null : (
                        <CommandGroup
                          key={group.id}
                          heading={group.heading}
                          data-testid={`help-search-group-${group.id}`}
                          className="px-0 [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:text-neutral-500 dark:[&_[cmdk-group-heading]]:text-neutral-400"
                        >
                          {group.topics.map((topic) => (
                            <HelpTopicRow
                              key={`${group.id}-${topic.id}`}
                              selectionValue={`group:${group.id}:${topic.id}`}
                              topic={topic}
                              onActivate={openTopic}
                              onHighlight={setActiveValue}
                            />
                          ))}
                        </CommandGroup>
                        ),
                      )}
                    </>
                  )}
                </CommandList>
              </Command>

              <div
                className="shrink-0 space-y-2 border-t border-neutral-200 px-4 py-3 dark:border-neutral-800"
                data-testid="help-search-panel-footer"
              >
                <p className={cn("m-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                  Need help?{" "}
                  <button
                    type="button"
                    className={cn(
                      "font-medium underline-offset-2 hover:underline",
                      OPERATOR_LINK.optional,
                    )}
                    onClick={() => {
                      onOpenChange(false);
                      onOpenGuidesPanel?.("troubleshooting");
                    }}
                  >
                    Contact support
                  </button>
                </p>
                <p
                  className={cn("m-0 text-neutral-400 dark:text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}
                  data-testid="help-search-keyboard-hint"
                >
                  {HELP_SEARCH_PANEL_KEYBOARD_HINT}
                </p>
              </div>
            </>
          )}
        </DialogContent>
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
