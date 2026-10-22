"use client";

import { cn } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";

import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import { PRIVACY_POLICY_TOC } from "@/lib/privacy-policy-layout";

export type PrivacyPolicyTableOfContentsProps = {
  readonly headings: readonly HelpMarkdownHeading[];
  /** Page client mounts this twice (mobile vs desktop column) — render only the matching landmark. */
  readonly variant: "mobile" | "desktop";
};

const MIN_HEADINGS_FOR_TOC = 4;

function readLocationHash(): string {
  if (typeof window === "undefined") {
    return "";
  }

  return window.location.hash.replace(/^#/, "").trim();
}

function PrivacyPolicyTocList(props: {
  readonly headings: readonly HelpMarkdownHeading[];
  readonly activeId: string;
}): React.JSX.Element {
  return (
    <ul className={PRIVACY_POLICY_TOC.list}>
      {props.headings.map((heading) => {
        const isActive = props.activeId.length > 0 && props.activeId === heading.id;

        return (
          <li key={heading.id}>
            <a
              href={`#${heading.id}`}
              aria-current={isActive ? "location" : undefined}
              className={cn(
                PRIVACY_POLICY_TOC.link,
                heading.level === 3 ? PRIVACY_POLICY_TOC.linkNested : "",
                isActive ? PRIVACY_POLICY_TOC.linkActive : "",
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

function syncUrlHash(id: string): void {
  if (typeof window === "undefined" || id.length === 0) {
    return;
  }

  const nextHash = `#${id}`;

  if (window.location.hash === nextHash) {
    return;
  }

  const url = `${window.location.pathname}${window.location.search}${nextHash}`;
  window.history.replaceState(null, "", url);
}

/** Sticky in-page navigation for the public privacy policy. */
export function PrivacyPolicyTableOfContents(props: PrivacyPolicyTableOfContentsProps): React.JSX.Element | null {
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
    if (sectionIds.length === 0) {
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
          syncUrlHash(nextId);
        }
      },
      {
        rootMargin: "-12% 0px -58% 0px",
        threshold: [0, 0.15, 0.35, 0.55, 1],
      },
    );

    for (const element of elements) {
      observer.observe(element);
    }

    return () => {
      observer.disconnect();
    };
  }, [sectionIds]);

  if (props.headings.length < MIN_HEADINGS_FOR_TOC) {
    return null;
  }

  if (props.variant === "mobile") {
    return (
      <details className={PRIVACY_POLICY_TOC.mobileDetails} data-testid="privacy-policy-toc-mobile">
        <summary className={PRIVACY_POLICY_TOC.mobileSummary}>On this page</summary>
        <nav aria-label="On this page (mobile)" className="mt-3">
          <PrivacyPolicyTocList headings={props.headings} activeId={activeId} />
        </nav>
      </details>
    );
  }

  return (
    <nav
      aria-label="On this page (desktop)"
      tabIndex={0}
      className={cn(PRIVACY_POLICY_TOC.nav, "hidden xl:block")}
      data-testid="privacy-policy-toc"
    >
      <p className={PRIVACY_POLICY_TOC.heading} data-testid="privacy-policy-toc-heading">
        On this page
      </p>
      <PrivacyPolicyTocList headings={props.headings} activeId={activeId} />
    </nav>
  );
}
