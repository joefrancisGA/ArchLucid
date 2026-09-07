"use client";

import { cn } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { useGovernanceMode } from "@/hooks/use-governance-mode";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { resolveReviewWorkspaceArchitectureId } from "@/lib/architecture/working-architecture-review-routes";
import { scheduleScrollToReviewDetailSection, scheduleScrollToReviewDetailHashFromLocation } from "@/lib/review-detail-section-scroll";
import {
  REVIEW_DETAIL_TAB_PARAM,
  buildReviewDetailTabHref,
  isReviewDetailTabId,
  resolveReviewDetailTab,
  type ReviewDetailTabId,
} from "@/lib/review-detail-workspace-tabs";

export type RunDetailSection = {
  id: string;
  label: string;
  available: boolean;
};

type RunDetailSectionNavProps = {
  readonly runId: string;
  readonly parentArchitectureId?: string | null;
  sections: RunDetailSection[];
};

/**
 * Sticky tab navigation for long run detail pages when the tab row is not already visible.
 */
export function RunDetailSectionNav({ runId, parentArchitectureId, sections }: RunDetailSectionNavProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const architectureId = resolveReviewWorkspaceArchitectureId(parentArchitectureId, pathname);
  const { isGovernanceModeEnabled, vocabulary } = useGovernanceMode();
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const activeReviewTab = resolveReviewDetailTab(searchParams.get(REVIEW_DETAIL_TAB_PARAM));

  const normalizedSections = useMemo(() => {
    return sections
      .filter((section) => {
        if (section.id === "authority-chain" && !isGovernanceModeEnabled) {
          return false;
        }

        return section.available;
      })
      .map((section) => {
        if (section.id === "authority-chain") {
          return { ...section, label: vocabulary.authorityChainLabel };
        }

        if (section.id === "manifest-summary" && !buyerPolishedShell) {
          return { ...section, label: vocabulary.manifestSummaryHeading };
        }

        return section;
      });
  }, [sections, isGovernanceModeEnabled, vocabulary, buyerPolishedShell]);

  const visible = normalizedSections;
  const [activeId, setActiveId] = useState<string | null>(visible[0]?.id ?? null);

  useEffect(() => {
    const tabSection = visible.find((section) => isReviewDetailTabId(section.id));

    if (tabSection !== undefined && tabSection.id === activeReviewTab) {
      setActiveId(tabSection.id);

      return;
    }

    setActiveId(visible[0]?.id ?? null);
  }, [activeReviewTab, visible]);

  useEffect(() => {
    const sectionIds = visible
      .map((section) => section.id)
      .filter((sectionId) => !isReviewDetailTabId(sectionId));

    if (sectionIds.length === 0 || typeof window === "undefined") {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => left.boundingClientRect.top - right.boundingClientRect.top);

        const topEntry = visibleEntries[0];

        if (topEntry?.target.id !== undefined && topEntry.target.id.length > 0) {
          setActiveId(topEntry.target.id);
        }
      },
      {
        root: null,
        rootMargin: "-20% 0px -55% 0px",
        threshold: 0,
      },
    );

    for (const sectionId of sectionIds) {
      const target = document.getElementById(sectionId);

      if (target !== null) {
        observer.observe(target);
      }
    }

    return () => {
      observer.disconnect();
    };
  }, [visible]);

  useEffect(() => {
    scheduleScrollToReviewDetailHashFromLocation();

    function onHashChange(): void {
      scheduleScrollToReviewDetailHashFromLocation();
    }

    window.addEventListener("hashchange", onHashChange);

    return () => {
      window.removeEventListener("hashchange", onHashChange);
    };
  }, [visible]);

  if (visible.length < 3) {
    return null;
  }

  const buyerStickyChrome = isBuyerPolishedOperatorShellEnv();

  return (
    <nav
      aria-label="On this page sections"
      className={cn(
        "sticky z-20 mb-4 max-w-3xl rounded-lg border border-neutral-200 bg-white/95 px-2 py-2 backdrop-blur dark:border-neutral-700 dark:bg-neutral-950/95",
        buyerStickyChrome ? "top-40 lg:top-44" : "top-16",
      )}
    >
      <p className={cn("mb-1.5 text-neutral-500 dark:text-neutral-400", OPERATOR_NAV_GROUP_LABEL)}>
        On this page
      </p>
      <ul className={cn("m-0 flex list-none flex-wrap gap-1 p-0", OPERATOR_TYPOGRAPHY.body)}>
        {visible.map((section) => {
          const active = activeId === section.id;
          const href = isReviewDetailTabId(section.id)
            ? buildReviewDetailTabHref(runId, section.id as ReviewDetailTabId, { architectureId })
            : `#${section.id}`;

          return (
            <li key={section.id}>
              <a
                href={href}
                className={
                  active
                    ? "rounded-md bg-[var(--al-layer-hover)] px-2 py-1 font-semibold text-al-text-primary underline decoration-[var(--al-accent-interactive)] decoration-2 underline-offset-2 dark:bg-neutral-800/80"
                    : "rounded-md px-2 py-1 text-neutral-800 underline decoration-neutral-400 decoration-1 underline-offset-2 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
                }
                aria-current={active ? "page" : undefined}
                onClick={(event) => {
                  setActiveId(section.id);

                  if (isReviewDetailTabId(section.id)) {
                    return;
                  }

                  event.preventDefault();
                  scheduleScrollToReviewDetailSection(section.id);
                }}
              >
                {section.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
