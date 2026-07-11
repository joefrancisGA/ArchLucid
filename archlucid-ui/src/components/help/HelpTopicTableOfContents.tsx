"use client";

import { cn } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";

import type { HelpMarkdownHeading } from "@/lib/help-markdown-headings";
import { HELP_PAGE_TOC } from "@/lib/help-page-layout";

export type HelpTopicTableOfContentsProps = {
  readonly headings: readonly HelpMarkdownHeading[];
  /** When true, highlights the section nearest the viewport center while scrolling. */
  readonly enableScrollSpy?: boolean;
};

const MIN_HEADINGS_FOR_TOC = 4;

function readLocationHash(): string {
  if (typeof window === "undefined") {
    return "";
  }

  return window.location.hash.replace(/^#/, "").trim();
}

function TableOfContentsList(props: {
  readonly headings: readonly HelpMarkdownHeading[];
  readonly activeId: string;
}): React.JSX.Element {
  return (
    <ul className={HELP_PAGE_TOC.list}>
      {props.headings.map((heading) => {
        const isActive = props.activeId.length > 0 && props.activeId === heading.id;

        return (
          <li key={heading.id}>
            <a
              href={`#${heading.id}`}
              aria-current={isActive ? "location" : undefined}
              className={cn(
                HELP_PAGE_TOC.link,
                heading.level === 3 ? HELP_PAGE_TOC.linkNested : "",
                isActive ? HELP_PAGE_TOC.linkActive : "",
              )}
            >
              {heading.title}
            </a>
          </li>
        );
      })}
    </ul>
  );
}

/** Sticky jump links for long in-app help topics. */
export function HelpTopicTableOfContents(props: HelpTopicTableOfContentsProps): React.JSX.Element | null {
  const [activeId, setActiveId] = useState("");
  const sectionIds = useMemo(() => props.headings.map((heading) => heading.id), [props.headings]);

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

  if (props.headings.length < MIN_HEADINGS_FOR_TOC) {
    return null;
  }

  return (
    <>
      <details className="mb-4 rounded-md border border-neutral-200 bg-al-surface-raised p-3 lg:hidden dark:border-neutral-800">
        <summary className={cn("cursor-pointer font-semibold", HELP_PAGE_TOC.heading)}>On this page</summary>
        <nav aria-label="On this page" className="mt-3" data-testid="help-topic-toc-mobile">
          <TableOfContentsList headings={props.headings} activeId={activeId} />
        </nav>
      </details>

      <nav
        aria-label="On this page"
        className={cn(HELP_PAGE_TOC.nav, "hidden lg:block")}
        data-testid="help-topic-toc"
      >
        <p className={HELP_PAGE_TOC.heading} data-testid="help-topic-toc-heading">
          On this page
        </p>
        <TableOfContentsList headings={props.headings} activeId={activeId} />
      </nav>
    </>
  );
}
