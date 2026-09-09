"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { cn } from "@/lib/utils";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { settingsMasterSectionDomId } from "./settings-master-catalog";
import type { SettingsMasterVisibleSection } from "./settings-master-page-model";

type SettingsMasterSectionNavProps = {
  readonly sections: readonly SettingsMasterVisibleSection[];
};

export function SettingsMasterSectionNav(props: SettingsMasterSectionNavProps) {
  const sectionIds = useMemo(
    () => props.sections.map((section) => settingsMasterSectionDomId(section.id)),
    [props.sections],
  );
  const [activeId, setActiveId] = useState<string | null>(sectionIds[0] ?? null);

  useEffect(() => {
    setActiveId(sectionIds[0] ?? null);
  }, [sectionIds]);

  useEffect(() => {
    if (sectionIds.length === 0 || typeof window === "undefined" || typeof IntersectionObserver === "undefined") {
      return;
    }

    const visibilityById = new Map<string, number>();

    const pickActiveSectionId = (): string | null => {
      const lastSectionId = sectionIds[sectionIds.length - 1] ?? null;
      const scrollBottom = window.scrollY + window.innerHeight;
      const documentBottom = document.documentElement.scrollHeight;

      if (lastSectionId !== null && scrollBottom >= documentBottom - 48) {
        return lastSectionId;
      }

      let bestId: string | null = null;
      let bestRatio = 0;

      for (const sectionId of sectionIds) {
        const ratio = visibilityById.get(sectionId) ?? 0;

        if (ratio > bestRatio) {
          bestRatio = ratio;
          bestId = sectionId;
        }
      }

      return bestId ?? sectionIds[0] ?? null;
    };

    const syncActiveSection = () => {
      const nextActiveId = pickActiveSectionId();

      if (nextActiveId !== null) {
        setActiveId(nextActiveId);
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.target.id.length > 0) {
            visibilityById.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0);
          }
        }

        syncActiveSection();
      },
      {
        root: null,
        rootMargin: "-20% 0px -45% 0px",
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
      },
    );

    for (const sectionId of sectionIds) {
      const target = document.getElementById(sectionId);

      if (target !== null) {
        observer.observe(target);
      }
    }

    window.addEventListener("scroll", syncActiveSection, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", syncActiveSection);
    };
  }, [sectionIds]);

  return (
    <nav
      aria-label="Settings sections"
      className="lg:sticky lg:top-24 lg:self-start"
      data-testid="settings-master-section-nav"
    >
      <p className={cn("m-0 mb-2 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>Sections</p>
      <ul className="m-0 flex list-none flex-row gap-2 overflow-x-auto p-0 lg:flex-col lg:overflow-visible">
        {props.sections.map((section) => {
          const sectionDomId = settingsMasterSectionDomId(section.id);
          const active = activeId === sectionDomId;

          return (
            <li key={section.id} className="shrink-0">
              <Link
                href={`#${sectionDomId}`}
                className={cn(
                  OPERATOR_LINK.nav,
                  "block w-full rounded-md border border-transparent px-3 py-2 text-left transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800",
                  active ? "bg-neutral-100 font-semibold dark:bg-neutral-800/80" : undefined,
                  OPERATOR_TYPOGRAPHY.body,
                )}
                aria-current={active ? "page" : undefined}
                onClick={() => {
                  setActiveId(sectionDomId);
                }}
              >
                {section.navLabel}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
