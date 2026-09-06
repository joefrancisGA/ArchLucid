"use client";

import {
  COMMAND_PALETTE_ARIA_KEYSHORTCUTS,
  commandPaletteOpenAriaLabel,
  globalSearchInputTitle,
} from "@/lib/keyboard-shortcut-display";
import { GLOBAL_FIND_PAGE_SEARCH } from "@/lib/search-surface-disambiguation";
import { KeyboardShortcutBadge } from "@/components/KeyboardShortcutBadge";
import { Input } from "@/components/ui/input";
import { GlobalSearchGlobalResultsPanel } from "@/components/GlobalSearchGlobalResultsPanel";
import { GlobalSearchPackageResultsPanel } from "@/components/GlobalSearchPackageResultsPanel";
import { GlobalSearchQuickActionsPanel } from "@/components/GlobalSearchQuickActionsPanel";
import { GlobalSearchReviewDetailSectionsPanel } from "@/components/GlobalSearchReviewDetailSectionsPanel";
import { FilterChip } from "@/components/ui/filter-chip";
import { FilterChipGroup } from "@/components/ui/filter-chip-group";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { dispatchOpenCommandPalette } from "@/lib/shortcut-registry";
import type { ReviewPackageSearchScope } from "@/lib/review-detail-package-search-scope";
import { cn } from "@/lib/utils";
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
    packageResultsPanelOpen,
    globalResultsPanelOpen,
    resultsPanelOpen,
    packageSearchScope,
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

      <div
        className="flex min-w-0 flex-nowrap items-center gap-1.5"
        data-testid="global-search-control-row"
      >
        {packageSearchScope.packageScopeAvailable ? (
          <FilterChipGroup
            className={cn("flex shrink-0 gap-0.5", OPERATOR_TYPOGRAPHY.helper)}
            aria-label="Search scope"
            data-testid="global-search-package-scope-toggle"
          >
            {(["package", "workspace"] as const).map((scope: ReviewPackageSearchScope) => (
              <FilterChip
                key={scope}
                aria-pressed={packageSearchScope.searchScope === scope}
                onClick={() => {
                  packageSearchScope.setSearchScope(scope);
                }}
                data-testid={`global-search-scope-${scope}`}
              >
                {packageSearchScope.scopeLabels[scope]}
              </FilterChip>
            ))}
          </FilterChipGroup>
        ) : null}

        <div className="relative min-w-0 flex-1">
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
            className="h-8 border-neutral-300 bg-white pr-14 text-al-text-primary placeholder:text-neutral-600 dark:border-neutral-600 dark:bg-neutral-900 dark:placeholder:text-neutral-400"
          />
          <div
            className="absolute inset-y-0 right-2 flex items-center"
          >
            <button
              type="button"
              className="rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--al-accent-border-focus)]"
              aria-label={commandPaletteOpenAriaLabel("Open command palette")}
              aria-keyshortcuts={COMMAND_PALETTE_ARIA_KEYSHORTCUTS}
              data-testid="global-search-command-palette-shortcut"
              onClick={() => {
                dispatchOpenCommandPalette();
              }}
            >
              <KeyboardShortcutBadge className="shrink-0" />
            </button>
          </div>
        </div>
      </div>

      {quickActionsPanelOpen ? (
        <GlobalSearchQuickActionsPanel inputId={inputId} onClose={closePanel} />
      ) : null}

      {reviewDetailPanelOpen ? <GlobalSearchReviewDetailSectionsPanel controller={controller} /> : null}

      {packageResultsPanelOpen ? <GlobalSearchPackageResultsPanel controller={controller} /> : null}

      {globalResultsPanelOpen ? <GlobalSearchGlobalResultsPanel controller={controller} /> : null}
    </div>
  );
}
