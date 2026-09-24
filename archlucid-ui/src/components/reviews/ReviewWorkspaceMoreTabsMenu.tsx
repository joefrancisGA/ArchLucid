"use client";

import { ChevronDown } from "lucide-react";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type SetStateAction } from "react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { resolveReviewWorkspaceTabLabel } from "@/lib/resolve-review-workspace-tab-label";
import type { ReviewWorkspaceLifecycle } from "@/lib/resolve-review-workspace-lifecycle";
import type { ReviewDetailTabId } from "@/lib/review-detail-workspace-tabs";
import {
  parseReviewWorkspaceMoreTabsOpenFromSearch,
  reviewWorkspaceMoreTabsHrefFromSearch,
} from "@/lib/reviews/review-workspace-more-tabs-url";
import { commitHrefIfChanged, readWindowLocationSearch } from "@/lib/navigation/replace-if-href-changed";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export const REVIEW_WORKSPACE_MORE_TABS_TEST_ID = "review-detail-workspace-more-tabs";

export type ReviewWorkspaceMoreTabsMenuProps = {
  readonly lifecycle: ReviewWorkspaceLifecycle;
  readonly moreTabIds: readonly ReviewDetailTabId[];
  readonly activeTab: ReviewDetailTabId;
  readonly onTabChange: (tab: ReviewDetailTabId) => void;
};

/** Secondary review workspace tabs behind a single More sections affordance. */
export function ReviewWorkspaceMoreTabsMenu(props: ReviewWorkspaceMoreTabsMenuProps): React.JSX.Element | null {
  const pathname = usePathname() ?? "";
  const [open, setOpenState] = useState(() =>
    parseReviewWorkspaceMoreTabsOpenFromSearch(
      typeof window === "undefined"
        ? null
        : new URLSearchParams(window.location.search).get("reviewMoreTabsOpen"),
    ),
  );
  const openRef = useRef(open);
  openRef.current = open;

  const syncMoreTabsOpenToUrl = useCallback(
    (nextOpen: boolean) => {
      commitHrefIfChanged(reviewWorkspaceMoreTabsHrefFromSearch(readWindowLocationSearch(), nextOpen, pathname), {
        notify: false,
      });
    },
    [pathname],
  );

  const setOpen = useCallback(
    (value: SetStateAction<boolean>) => {
      const current = openRef.current;
      const next = typeof value === "function" ? value(current) : value;

      if (openRef.current === next) {
        return;
      }

      openRef.current = next;
      setOpenState(next);
      syncMoreTabsOpenToUrl(next);
    },
    [syncMoreTabsOpenToUrl],
  );

  useEffect(() => {
    const syncMoreTabsOpenFromUrl = (): void => {
      const nextOpen = parseReviewWorkspaceMoreTabsOpenFromSearch(
        new URLSearchParams(window.location.search).get("reviewMoreTabsOpen"),
      );

      if (openRef.current === nextOpen) {
        return;
      }

      openRef.current = nextOpen;
      setOpenState(nextOpen);
    };

    syncMoreTabsOpenFromUrl();
    window.addEventListener("popstate", syncMoreTabsOpenFromUrl);

    return () => {
      window.removeEventListener("popstate", syncMoreTabsOpenFromUrl);
    };
  }, []);

  if (props.moreTabIds.length === 0) {
    return null;
  }

  const activeInMore = props.moreTabIds.includes(props.activeTab);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant={activeInMore ? "secondary" : "outline"}
          size="sm"
          className="whitespace-nowrap"
          data-testid={REVIEW_WORKSPACE_MORE_TABS_TEST_ID}
          aria-haspopup="menu"
          aria-expanded={open}
        >
          More sections
          <ChevronDown className="ml-1 h-4 w-4" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-1">
        <ul className="m-0 list-none p-0" role="menu" aria-label="More review workspace sections">
          {props.moreTabIds.map((tabId) => {
            const selected = props.activeTab === tabId;

            return (
              <li key={tabId} role="none">
                <button
                  type="button"
                  role="menuitem"
                  className={cn(
                    "w-full rounded px-2 py-1.5 text-left",
                    OPERATOR_TYPOGRAPHY.body,
                    selected
                      ? "bg-neutral-100 font-semibold text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100"
                      : "text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-900",
                  )}
                  data-testid={`review-detail-workspace-more-tab-${tabId}`}
                  aria-current={selected ? "true" : undefined}
                  onClick={() => {
                    props.onTabChange(tabId);
                    setOpen(false);
                  }}
                >
                  {resolveReviewWorkspaceTabLabel(props.lifecycle, tabId)}
                </button>
              </li>
            );
          })}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
