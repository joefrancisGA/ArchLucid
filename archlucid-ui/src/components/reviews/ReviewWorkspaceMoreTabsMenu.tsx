"use client";

import { ChevronDown } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, type SetStateAction } from "react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { resolveReviewWorkspaceTabLabel } from "@/lib/resolve-review-workspace-tab-label";
import type { ReviewWorkspaceLifecycle } from "@/lib/resolve-review-workspace-lifecycle";
import type { ReviewDetailTabId } from "@/lib/review-detail-workspace-tabs";
import {
  parseReviewWorkspaceMoreTabsOpenFromSearch,
  reviewWorkspaceMoreTabsHrefFromSearch,
} from "@/lib/reviews/review-workspace-more-tabs-url";
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
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const reviewMoreTabsOpenParam = searchParams.get("reviewMoreTabsOpen");
  const [open, setOpenState] = useState(() => parseReviewWorkspaceMoreTabsOpenFromSearch(reviewMoreTabsOpenParam));

  const syncMoreTabsOpenToUrl = useCallback(
    (nextOpen: boolean) => {
      router.replace(reviewWorkspaceMoreTabsHrefFromSearch(searchParams.toString(), nextOpen, pathname), {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const setOpen = useCallback(
    (value: SetStateAction<boolean>) => {
      setOpenState((current) => {
        const next = typeof value === "function" ? value(current) : value;
        syncMoreTabsOpenToUrl(next);

        return next;
      });
    },
    [syncMoreTabsOpenToUrl],
  );

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
