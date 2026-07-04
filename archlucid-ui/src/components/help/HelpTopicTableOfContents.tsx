"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

import type { HelpMarkdownHeading } from "@/lib/help-markdown-headings";
import { HELP_PAGE_TOC } from "@/lib/help-page-layout";

export type HelpTopicTableOfContentsProps = {
  readonly headings: readonly HelpMarkdownHeading[];
};

const MIN_HEADINGS_FOR_TOC = 4;

function readLocationHash(): string {
  if (typeof window === "undefined") {
    return "";
  }

  return window.location.hash.replace(/^#/, "").trim();
}

/** Sticky jump links for long in-app help topics. */
export function HelpTopicTableOfContents(props: HelpTopicTableOfContentsProps): React.JSX.Element | null {
  const [activeId, setActiveId] = useState("");

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

  if (props.headings.length < MIN_HEADINGS_FOR_TOC) {
    return null;
  }

  return (
    <nav aria-label="On this page" className={HELP_PAGE_TOC.nav} data-testid="help-topic-toc">
      <p className={HELP_PAGE_TOC.heading} data-testid="help-topic-toc-heading">
        On this page
      </p>
      <ul className={HELP_PAGE_TOC.list}>
        {props.headings.map((heading) => {
          const isActive = activeId.length > 0 && activeId === heading.id;

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
    </nav>
  );
}
