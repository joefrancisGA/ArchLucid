"use client";

import { useEffect, useMemo, useState } from "react";

import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { cn } from "@/lib/utils";

export type RunDetailSection = {
  id: string;
  label: string;
  available: boolean;
};

type RunDetailSectionNavProps = {
  sections: RunDetailSection[];
};

/**
 * Sticky anchor navigation for long run detail pages; highlights the section in view via IntersectionObserver.
 */
export function RunDetailSectionNav({ sections }: RunDetailSectionNavProps) {
  const visible = useMemo(() => sections.filter((s) => s.available), [sections]);
  const [activeId, setActiveId] = useState<string | null>(visible[0]?.id ?? null);

  useEffect(() => {
    if (visible.length < 3)
    {
      return;
    }

    const elements = visible
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => el !== null);

    if (elements.length === 0)
    {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries.filter((e) => e.isIntersecting);

        if (visibleEntries.length === 0)
        {
          return;
        }

        visibleEntries.sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const id = visibleEntries[0].target.id;

        if (id.length > 0)
        {
          setActiveId(id);
        }
      },
      { rootMargin: "-40% 0px -45% 0px", threshold: [0, 0.1, 0.25, 0.5, 0.75, 1] },
    );

    for (const el of elements)
    {
      observer.observe(el);
    }

    return () => {
      observer.disconnect();
    };
  }, [visible]);

  if (visible.length < 3)
  {
    return null;
  }

  const buyerStickyChrome = isBuyerPolishedOperatorShellEnv();

  return (
    <nav
      aria-label="Review detail sections"
      className={cn(
        "sticky z-20 mb-4 max-w-3xl rounded-lg border border-neutral-200 bg-white/95 px-2 py-2 backdrop-blur dark:border-neutral-700 dark:bg-neutral-950/95",
        buyerStickyChrome ? "top-40 lg:top-44" : "top-16",
      )}
    >
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
        On this page
      </p>
      <ul className="m-0 flex list-none flex-wrap gap-1 p-0 text-sm">
        {visible.map((s) => {
          const active = activeId === s.id;

          return (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                className={
                  active
                    ? "rounded-md bg-[var(--al-layer-hover)] px-2 py-1 font-semibold text-al-text-primary underline decoration-[var(--al-accent-interactive)] decoration-2 underline-offset-2 dark:bg-neutral-800/80"
                    : "rounded-md px-2 py-1 text-neutral-800 underline decoration-neutral-400 decoration-1 underline-offset-2 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
                }
                aria-current={active ? "page" : undefined}
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
              >
                {s.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
