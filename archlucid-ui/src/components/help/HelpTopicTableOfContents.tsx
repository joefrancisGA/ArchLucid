"use client";

import { cn } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";

import type { HelpMarkdownHeading } from "@/lib/help-markdown-headings";
import type { HelpTopicTocGroup } from "@/lib/caiq-sig-response-help-presentation";
import { HELP_PAGE_TOC } from "@/lib/help-page-layout";

export type HelpTopicTableOfContentsProps = {
  readonly headings: readonly HelpMarkdownHeading[];
  /** Optional grouped parents (for example CAIQ Lite vs SIG Core halves). */
  readonly groups?: readonly HelpTopicTocGroup[];
  /** When true, highlights the section nearest the viewport center while scrolling. */
  readonly enableScrollSpy?: boolean;
  /** Where to render: default shows both; header-inline is mobile-only beneath page header; sidebar is xl sticky rail. */
  readonly placement?: "default" | "header-inline" | "sidebar";
};

const MIN_HEADINGS_FOR_TOC = 4;

function readLocationHash(): string {
  if (typeof window === "undefined") {
    return "";
  }

  return window.location.hash.replace(/^#/, "").trim();
}

function TableOfContentsLink(props: {
  readonly heading: HelpMarkdownHeading;
  readonly activeId: string;
}): React.JSX.Element {
  const isActive = props.activeId.length > 0 && props.activeId === props.heading.id;

  return (
    <a
      href={`#${props.heading.id}`}
      aria-current={isActive ? "location" : undefined}
      className={cn(
        HELP_PAGE_TOC.link,
        props.heading.level === 3 ? HELP_PAGE_TOC.linkNested : "",
        isActive ? HELP_PAGE_TOC.linkActive : "",
      )}
    >
      {props.heading.title}
    </a>
  );
}

function TableOfContentsList(props: {
  readonly headings: readonly HelpMarkdownHeading[];
  readonly activeId: string;
}): React.JSX.Element {
  return (
    <ul className={HELP_PAGE_TOC.list}>
      {props.headings.map((heading) => (
        <li key={heading.id}>
          <TableOfContentsLink heading={heading} activeId={props.activeId} />
        </li>
      ))}
    </ul>
  );
}

function GroupedTableOfContentsList(props: {
  readonly groups: readonly HelpTopicTocGroup[];
  readonly activeId: string;
}): React.JSX.Element {
  return (
    <ul className={HELP_PAGE_TOC.list}>
      {props.groups.map((group) => (
        <li key={group.id}>
          <details
            className={cn(HELP_PAGE_TOC.referenceGroup, HELP_PAGE_TOC.referenceGroupOpen)}
            open
          >
            <summary className={HELP_PAGE_TOC.referenceGroupSummary}>
              <span className="font-semibold text-al-text-primary">{group.label}</span>
            </summary>
            <ul className={HELP_PAGE_TOC.referenceGroupChildren}>
              {group.headings.map((heading) => (
                <li key={heading.id}>
                  <TableOfContentsLink heading={heading} activeId={props.activeId} />
                </li>
              ))}
            </ul>
          </details>
        </li>
      ))}
    </ul>
  );
}

/** Sticky jump links for long in-app help topics. */
export function HelpTopicTableOfContents(props: HelpTopicTableOfContentsProps): React.JSX.Element | null {
  const [activeId, setActiveId] = useState("");
  const sectionIds = useMemo(() => {
    if (props.groups !== undefined && props.groups.length > 0) {
      return props.groups.flatMap((group) => group.headings.map((heading) => heading.id));
    }

    return props.headings.map((heading) => heading.id);
  }, [props.groups, props.headings]);

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

    if (elements.length === 0) {
      return;
    }

    if (typeof IntersectionObserver === "undefined") {
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

  const headingCount =
    props.groups !== undefined && props.groups.length > 0
      ? props.groups.reduce((total, group) => total + group.headings.length, 0)
      : props.headings.length;

  if (headingCount < MIN_HEADINGS_FOR_TOC) {
    return null;
  }

  const tocBody =
    props.groups !== undefined && props.groups.length > 0 ? (
      <GroupedTableOfContentsList groups={props.groups} activeId={activeId} />
    ) : (
      <TableOfContentsList headings={props.headings} activeId={activeId} />
    );

  const placement = props.placement ?? "default";
  const showHeaderInline = placement === "default" || placement === "header-inline";
  const showSidebar = placement === "default" || placement === "sidebar";

  return (
    <>
      {showHeaderInline ? (
        <details className="mb-4 rounded-md border border-neutral-200 bg-al-surface-raised p-3 xl:hidden dark:border-neutral-800">
          <summary className={cn("cursor-pointer font-semibold", HELP_PAGE_TOC.heading)}>On this page</summary>
          <nav aria-label="On this page" className="mt-3" data-testid="help-topic-toc-mobile">
            {tocBody}
          </nav>
        </details>
      ) : null}

      {showSidebar ? (
        <nav
          aria-label="On this page"
          className={cn(HELP_PAGE_TOC.nav, "hidden xl:block")}
          data-testid="help-topic-toc"
          data-operator-side-rail-kind="toc-wizard"
        >
          <p className={HELP_PAGE_TOC.heading} data-testid="help-topic-toc-heading">
            On this page
          </p>
          {tocBody}
        </nav>
      ) : null}
    </>
  );
}
