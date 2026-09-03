"use client";

import {
  COMMAND_PALETTE_ARIA_KEYSHORTCUTS,
  globalSearchInputTitle,
} from "@/lib/keyboard-shortcut-display";
import { GLOBAL_FIND_PAGE_SEARCH } from "@/lib/search-surface-disambiguation";
import { Input } from "@/components/ui/input";
import { GlobalSearchGlobalResultsPanel } from "@/components/GlobalSearchGlobalResultsPanel";
import { GlobalSearchQuickActionsPanel } from "@/components/GlobalSearchQuickActionsPanel";
import { GlobalSearchReviewDetailSectionsPanel } from "@/components/GlobalSearchReviewDetailSectionsPanel";
import type { GlobalSearchBarController } from "@/components/use-global-search-bar";

type GlobalSearchBarShellProps = {
  readonly controller: GlobalSearchBarController;
  readonly className?: string;
};

export function GlobalSearchBarShell(props: GlobalSearchBarShellProps) {
  const { controller } = props;
  const {
    inputId,
    inputRef,
    rootRef,
    query,
    searchPlaceholder,
    searchAriaLabel,
    quickActionsPanelOpen,
    reviewDetailPanelOpen,
    globalResultsPanelOpen,
    resultsPanelOpen,
    closePanel,
    handleQueryChange,
    handleInputFocus,
    handleInputKeyDown,
  } = controller;

  return (
    <div
      ref={rootRef}
      id="find-a-page"
      className={props.className ?? "relative w-full"}
      data-testid="global-search"
    >
      <label htmlFor={inputId} className="sr-only">
        {searchAriaLabel}
      </label>
      <p id={`${inputId}-helper`} className="sr-only">
        {GLOBAL_FIND_PAGE_SEARCH.helper}
      </p>

      <Input
        ref={inputRef}
        id={inputId}
        type="search"
        placeholder={searchPlaceholder}
        title={globalSearchInputTitle()}
        value={query}
        onChange={(event) => handleQueryChange(event.target.value)}
        onFocus={handleInputFocus}
        onKeyDown={handleInputKeyDown}
        role="combobox"
        aria-autocomplete="list"
        aria-haspopup={resultsPanelOpen ? "listbox" : quickActionsPanelOpen ? "dialog" : undefined}
        aria-expanded={resultsPanelOpen || quickActionsPanelOpen}
        aria-controls={resultsPanelOpen || quickActionsPanelOpen ? `${inputId}-results` : undefined}
        aria-label={searchAriaLabel}
        aria-describedby={`${inputId}-helper`}
        aria-keyshortcuts={COMMAND_PALETTE_ARIA_KEYSHORTCUTS}
        autoComplete="off"
        className="h-8 border-neutral-300 bg-white text-al-text-primary placeholder:text-neutral-600 dark:border-neutral-600 dark:bg-neutral-900 dark:placeholder:text-neutral-400"
      />

      {quickActionsPanelOpen ? (
        <GlobalSearchQuickActionsPanel inputId={inputId} onClose={closePanel} />
      ) : null}

      {reviewDetailPanelOpen ? <GlobalSearchReviewDetailSectionsPanel controller={controller} /> : null}

      {globalResultsPanelOpen ? <GlobalSearchGlobalResultsPanel controller={controller} /> : null}
    </div>
  );
}
