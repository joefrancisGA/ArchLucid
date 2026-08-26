"use client";

import { HelpDrawerDoThisNowRow } from "@/components/help/HelpDrawerDoThisNowRow";
import { HelpDrawerTopicRow } from "@/components/help/HelpDrawerTopicRow";
import { OperatorShellSupportQuickLinks } from "@/components/help/OperatorShellSupportQuickLinks";
import { HelpDrawerDocHitRow, HelpDrawerGroupHeading } from "@/components/HelpSearchDrawerHits";
import { HELP_DRAWER_ROW_LIST_CLASS } from "@/components/help/help-drawer-row-class";
import type { HelpTabId } from "@/components/HelpPanel";
import {
  HELP_SEARCH_PANEL_EMPTY_HINT,
  HELP_SEARCH_PANEL_EMPTY_TITLE,
  HELP_SEARCH_PANEL_KEYBOARD_HINT,
  HELP_SEARCH_PANEL_START_HERE_COLLAPSED_SUMMARY,
  type HelpSearchPanelTopic,
} from "@/lib/help/help-search-panel-catalog";
import type { HelpDocSearchRecord } from "@/lib/help/help-index";
import { HELP_ON_HELP_ON_THIS_PAGE_HEADING } from "@/lib/help/help-on-help";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { helpRecordSelectionValue } from "@/components/help-search-panel-hrefs";
import { cn } from "@/lib/utils";

import { HELP_SEARCH_PANEL_START_HERE_GROUP_ID } from "./help-search-panel-presentation";

export type HelpSearchPanelResultsProps = {
  readonly isSearching: boolean;
  readonly filteredTopics: readonly HelpSearchPanelTopic[];
  readonly hits: readonly HelpDocSearchRecord[];
  readonly highlightedRowId: string;
  readonly onHighlightRow: (rowId: string) => void;
  readonly onOpenTopic: (topic: HelpSearchPanelTopic) => void;
  readonly onOpenSearchHit: (hit: HelpDocSearchRecord) => void;
  readonly doThisNow: HelpSearchPanelTopic | null;
  readonly onThisPageAnchors: readonly HelpDocSearchRecord[];
  readonly onOpenCurrentPageAnchor: (record: HelpDocSearchRecord) => void;
  readonly moreRecommended: readonly HelpSearchPanelTopic[];
  readonly visibleGroupsWithoutRecommended: ReadonlyArray<{
    readonly id: string;
    readonly heading: string;
    readonly topics: readonly HelpSearchPanelTopic[];
  }>;
  readonly collapseStartHere: boolean;
  readonly topicListRef: React.RefObject<HTMLDivElement | null>;
  readonly onTopicListKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => void;
  readonly onOpenChange: (open: boolean) => void;
  readonly onOpenGuidesTab: (tab: HelpTabId) => void;
};

export function HelpSearchPanelResults({
  isSearching,
  filteredTopics,
  hits,
  highlightedRowId,
  onHighlightRow,
  onOpenTopic,
  onOpenSearchHit,
  doThisNow,
  onThisPageAnchors,
  onOpenCurrentPageAnchor,
  moreRecommended,
  visibleGroupsWithoutRecommended,
  collapseStartHere,
  topicListRef,
  onTopicListKeyDown,
  onOpenChange,
  onOpenGuidesTab,
}: HelpSearchPanelResultsProps) {
  return (
    <>
      <div
        ref={topicListRef}
        className="min-h-0 flex-1 overflow-y-auto px-3 py-3"
        role="navigation"
        aria-label="Help topics"
        onKeyDown={onTopicListKeyDown}
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
                        onActivate={onOpenTopic}
                        onHighlight={() => {
                          onHighlightRow(rowId);
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
                        onActivate={onOpenSearchHit}
                        onHighlight={() => {
                          onHighlightRow(rowId);
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
                onActivate={onOpenTopic}
                onHighlight={() => {
                  onHighlightRow(`do-this-now:${doThisNow.id}`);
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
                        onActivate={onOpenCurrentPageAnchor}
                        onHighlight={() => {
                          onHighlightRow(rowId);
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
                        onActivate={onOpenTopic}
                        onHighlight={() => {
                          onHighlightRow(rowId);
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
              const collapsed = collapseStartHere && group.id === HELP_SEARCH_PANEL_START_HERE_GROUP_ID;
              const heading = <HelpDrawerGroupHeading id={headingId}>{group.heading}</HelpDrawerGroupHeading>;
              const rows = (
                <ul className={HELP_DRAWER_ROW_LIST_CLASS}>
                  {group.topics.map((topic) => {
                    const rowId = `group:${group.id}:${topic.id}`;

                    return (
                      <HelpDrawerTopicRow
                        key={rowId}
                        topic={topic}
                        isHighlighted={highlightedRowId === rowId}
                        onActivate={onOpenTopic}
                        onHighlight={() => {
                          onHighlightRow(rowId);
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
              onOpenGuidesTab("shortcuts");
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
  );
}
