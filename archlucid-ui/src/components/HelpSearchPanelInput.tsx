"use client";

import { ArrowLeft, ExternalLink, Search } from "lucide-react";
import Link from "next/link";

import { HelpArticleLoadFailurePanel } from "@/components/help/HelpArticleLoadFailurePanel";
import { HelpArticleSkeleton } from "@/components/help/HelpArticleSkeleton";
import { HelpDrawerBuyerChrome } from "@/components/help/HelpDrawerBuyerChrome";
import { HelpSearchPanelHeader } from "@/components/help/HelpSearchPanelHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MarketingAccessibilityMarkdownFragment } from "@/components/marketing/MarketingAccessibilityMarkdownFragment";
import {
  HELP_ARTICLE_LOAD_RETRY_LABEL,
  HELP_SEARCH_PANEL_SEARCH_PLACEHOLDER,
} from "@/lib/help/help-search-panel-catalog";
import { HELP_ON_HELP_SEARCH_PLACEHOLDER } from "@/lib/help/help-on-help";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { getProductDocumentationEntry, inAppHelpHref } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";

import type { HelpSearchPanelArticleState } from "./help-search-panel-presentation";

export type HelpSearchPanelInputProps = {
  readonly isViewingArticle: boolean;
  readonly browseSubtitle: string;
  readonly helpOnHelp: boolean;
  readonly query: string;
  readonly onQueryChange: (value: string) => void;
  readonly onSearchInputKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  readonly searchInputRef: React.RefObject<HTMLInputElement | null>;
  readonly article: HelpSearchPanelArticleState;
  readonly loadingSlug: string | null;
  readonly onBackToSearch: () => void;
  readonly onOpenChange: (open: boolean) => void;
  readonly onRetryArticleLoad: (slug: string) => void;
};

export function HelpSearchPanelInput({
  isViewingArticle,
  browseSubtitle,
  helpOnHelp,
  query,
  onQueryChange,
  onSearchInputKeyDown,
  searchInputRef,
  article,
  loadingSlug,
  onBackToSearch,
  onOpenChange,
  onRetryArticleLoad,
}: HelpSearchPanelInputProps) {
  if (isViewingArticle) {
    return (
      <>
        <div className="flex shrink-0 items-center gap-2 border-b border-neutral-200 px-3 py-2.5 dark:border-neutral-800">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn("h-7 gap-1.5 px-2", OPERATOR_TYPOGRAPHY.button)}
            onClick={onBackToSearch}
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
                onRetryArticleLoad(loadingSlug);
              }}
            />
          ) : null}
          {article.status === "loaded" ? (
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
          ) : null}
        </div>
      </>
    );
  }

  return (
    <>
      <HelpSearchPanelHeader subtitle={browseSubtitle} />

      <div className="shrink-0 border-b border-neutral-200 px-5 pb-3 dark:border-neutral-800">
        <HelpDrawerBuyerChrome />
      </div>

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
            placeholder={helpOnHelp ? HELP_ON_HELP_SEARCH_PLACEHOLDER : HELP_SEARCH_PANEL_SEARCH_PLACEHOLDER}
            value={query}
            onChange={(event) => {
              onQueryChange(event.target.value);
            }}
            onKeyDown={onSearchInputKeyDown}
            aria-label="Search help"
            className={cn(
              "h-9 border-neutral-200 bg-white pl-8 font-normal text-neutral-900 shadow-none placeholder:text-neutral-400 focus-visible:ring-1 focus-visible:ring-teal-500 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100",
              OPERATOR_TYPOGRAPHY.body,
            )}
          />
        </div>
      </div>
    </>
  );
}
