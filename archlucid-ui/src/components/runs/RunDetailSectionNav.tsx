"use client";

import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";

import { useGovernanceMode } from "@/hooks/use-governance-mode";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  buildReviewDetailTabHref,
  isReviewDetailTabId,
  type ReviewDetailTabId,
} from "@/lib/review-detail-workspace-tabs";

export type RunDetailSection = {
  id: string;
  label: string;
  available: boolean;
};

type RunDetailSectionNavProps = {
  readonly runId: string;
  sections: RunDetailSection[];
};

/**
 * Sticky tab navigation for long run detail pages when the tab row is not already visible.
 */
export function RunDetailSectionNav({ runId, sections }: RunDetailSectionNavProps) {
  const { isGovernanceModeEnabled, vocabulary } = useGovernanceMode();
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

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

  if (visible.length < 3) {
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
      <p className={cn("mb-1.5 text-neutral-500 dark:text-neutral-400", OPERATOR_NAV_GROUP_LABEL)}>
        Review workspace tabs
      </p>
      <ul className={cn("m-0 flex list-none flex-wrap gap-1 p-0", OPERATOR_TYPOGRAPHY.body)}>
        {visible.map((section) => {
          const active = activeId === section.id;
          const href = isReviewDetailTabId(section.id)
            ? buildReviewDetailTabHref(runId, section.id as ReviewDetailTabId)
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
                onClick={() => {
                  setActiveId(section.id);
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
