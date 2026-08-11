"use client";

import { useEffect, useMemo, useState } from "react";

import { HelpTopicSectionCopyLink } from "@/components/help/HelpTopicSectionCopyLink";
import { cn } from "@/lib/utils";
import {
  filterHelpMarkdownHeadingGroups,
  flattenHelpMarkdownHeadingGroups,
  type HelpMarkdownHeadingGroup,
} from "@/lib/help-markdown-heading-groups";
import { HELP_PAGE_TOC } from "@/lib/help-page-layout";

export type HelpTechnicalReferenceNavigationProps = {
  readonly groups: readonly HelpMarkdownHeadingGroup[];
  /** When true, highlights the section nearest the viewport center while scrolling. */
  readonly enableScrollSpy?: boolean;
  /** Accessible name for the reference topic (default: CLI reference). */
  readonly navigationTopicLabel?: string;
};

const DEFAULT_OPEN_GROUP_COUNT = 3;

function readLocationHash(): string {
  if (typeof window === "undefined") {
    return "";
  }

  return window.location.hash.replace(/^#/, "").trim();
}

function groupContainsActiveId(group: HelpMarkdownHeadingGroup, activeId: string): boolean {
  if (activeId.length === 0) {
    return false;
  }

  if (group.section.id === activeId) {
    return true;
  }

  return group.children.some((child) => child.id === activeId);
}

function shouldDefaultOpenGroup(groupIndex: number, group: HelpMarkdownHeadingGroup, activeId: string): boolean {
  if (groupContainsActiveId(group, activeId)) {
    return true;
  }

  return groupIndex < DEFAULT_OPEN_GROUP_COUNT;
}

function ReferenceNavigationGroups(props: {
  readonly groups: readonly HelpMarkdownHeadingGroup[];
  readonly activeId: string;
}): React.JSX.Element {
  return (
    <div className="space-y-2" data-testid="help-technical-reference-toc-groups">
      {props.groups.map((group, index) => {
        const defaultOpen = shouldDefaultOpenGroup(index, group, props.activeId);
        const sectionIsActive = props.activeId.length > 0 && props.activeId === group.section.id;

        return (
          <details
            key={group.section.id}
            className={cn(HELP_PAGE_TOC.referenceGroup, defaultOpen ? HELP_PAGE_TOC.referenceGroupOpen : "")}
            open={defaultOpen}
            data-testid={`help-technical-reference-group-${group.section.id}`}
          >
            <summary className={HELP_PAGE_TOC.referenceGroupSummary}>
              <a
                href={`#${group.section.id}`}
                aria-current={sectionIsActive ? "location" : undefined}
                className={cn(
                  HELP_PAGE_TOC.link,
                  "min-w-0 flex-1 py-0",
                  sectionIsActive ? HELP_PAGE_TOC.linkActive : "",
                )}
                onClick={(event) => {
                  event.stopPropagation();
                }}
              >
                {group.section.title}
              </a>
              <HelpTopicSectionCopyLink sectionId={group.section.id} sectionTitle={group.section.title} />
            </summary>

            {group.children.length > 0 ? (
              <ul className={HELP_PAGE_TOC.referenceGroupChildren}>
                {group.children.map((child) => {
                  const childIsActive = props.activeId.length > 0 && props.activeId === child.id;

                  return (
                    <li key={child.id}>
                      <a
                        href={`#${child.id}`}
                        aria-current={childIsActive ? "location" : undefined}
                        className={cn(
                          HELP_PAGE_TOC.link,
                          HELP_PAGE_TOC.linkNested,
                          childIsActive ? HELP_PAGE_TOC.linkActive : "",
                        )}
                      >
                        {child.title}
                      </a>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </details>
        );
      })}
    </div>
  );
}

/** Hierarchical reference navigation with in-page search for long technical help topics. */
export function HelpTechnicalReferenceNavigation(props: HelpTechnicalReferenceNavigationProps): React.JSX.Element {
  const navigationTopicLabel = props.navigationTopicLabel ?? "CLI reference";
  const [activeId, setActiveId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const filtered = useMemo(
    () => filterHelpMarkdownHeadingGroups(props.groups, searchQuery),
    [props.groups, searchQuery],
  );
  const flattenedHeadings = useMemo(
    () => flattenHelpMarkdownHeadingGroups(filtered.groups),
    [filtered.groups],
  );
  const sectionIds = useMemo(() => flattenedHeadings.map((heading) => heading.id), [flattenedHeadings]);

  useEffect(() => {
    const syncHash = (): void => {
      setActiveId(readLocationHash());
    };

    syncHash();
    window.addEventListener("hashchange", syncHash);

    return () => {
      window.removeEventListener("hashchange", syncHash);
    };
  }, []);

  useEffect(() => {
    if (!props.enableScrollSpy || sectionIds.length === 0) {
      return;
    }

    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => element !== null);

    if (elements.length === 0 || typeof IntersectionObserver === "undefined") {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => right.intersectionRatio - left.intersectionRatio);

        if (visible.length === 0) {
          return;
        }

        const nextId = visible[0]?.target.id;

        if (nextId !== undefined && nextId.length > 0) {
          setActiveId(nextId);
        }
      },
      {
        rootMargin: "-15% 0px -55% 0px",
        threshold: [0, 0.2, 0.4, 0.6, 1],
      },
    );

    for (const element of elements) {
      observer.observe(element);
    }

    return () => {
      observer.disconnect();
    };
  }, [props.enableScrollSpy, sectionIds]);

  const matchSummary =
    searchQuery.trim().length === 0
      ? `${filtered.matchCount} indexed entries`
      : filtered.matchCount === 0
        ? "No matching sections"
        : `${filtered.matchCount} matching ${filtered.matchCount === 1 ? "entry" : "entries"}`;

  const navigationBody =
    filtered.groups.length === 0 ? (
      <p className={HELP_PAGE_TOC.referenceSearchMeta} data-testid="help-technical-reference-search-empty">
        No sections match &ldquo;{searchQuery.trim()}&rdquo;. Clear the filter to restore the full index.
      </p>
    ) : (
      <ReferenceNavigationGroups groups={filtered.groups} activeId={activeId} />
    );

  return (
    <>
      <details className="mb-4 rounded-md border border-neutral-200 bg-al-surface-raised p-3 lg:hidden dark:border-neutral-800">
        <summary className={cn("cursor-pointer font-semibold", HELP_PAGE_TOC.heading)}>Reference index</summary>
        <div className="mt-3 space-y-3" data-testid="help-technical-reference-toc-mobile">
          <label className="block">
            <span className="sr-only">Filter {navigationTopicLabel} sections</span>
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
              }}
              placeholder="Filter sections, commands, fields…"
              className={HELP_PAGE_TOC.referenceSearchInput}
              data-testid="help-technical-reference-search-mobile"
            />
          </label>
          <p className={HELP_PAGE_TOC.referenceSearchMeta}>{matchSummary}</p>
          <nav aria-label={`${navigationTopicLabel} index (mobile)`}>{navigationBody}</nav>
        </div>
      </details>

      <nav
        aria-label={`${navigationTopicLabel} index`}
        className={cn(HELP_PAGE_TOC.nav, "hidden lg:block")}
        data-testid="help-technical-reference-toc"
      >
        <p className={HELP_PAGE_TOC.heading} data-testid="help-technical-reference-toc-heading">
          Reference index
        </p>
        <label className="mt-3 block">
          <span className="sr-only">Filter {navigationTopicLabel} sections</span>
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value);
            }}
            placeholder="Filter sections, commands, fields…"
            className={HELP_PAGE_TOC.referenceSearchInput}
            data-testid="help-technical-reference-search"
          />
        </label>
        <p className={HELP_PAGE_TOC.referenceSearchMeta} data-testid="help-technical-reference-search-summary">
          {matchSummary}
        </p>
        <div className="mt-3">{navigationBody}</div>
      </nav>
    </>
  );
}
