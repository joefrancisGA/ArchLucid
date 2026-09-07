"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ReactElement } from "react";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  defaultReviewFindingsListView,
  parseReviewFindingsListViewFromSearch,
  reviewFindingsListViewHrefFromSearch,
  type ReviewFindingsListViewKind,
} from "@/lib/findings/review-findings-list-view";
import { cn } from "@/lib/utils";

export type RunDetailFindingsListViewToggleProps = {
  readonly workingMode: boolean;
};

export function RunDetailFindingsListViewToggle(props: RunDetailFindingsListViewToggleProps): ReactElement {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const urlView = parseReviewFindingsListViewFromSearch(searchParams.get("findingsListView"));
  const activeView = urlView ?? defaultReviewFindingsListView(props.workingMode);

  function setView(next: ReviewFindingsListViewKind): void {
    router.replace(reviewFindingsListViewHrefFromSearch(searchParams.toString(), next, pathname), { scroll: false });
  }

  return (
    <div
      className="flex flex-wrap items-center gap-2"
      role="group"
      aria-label="Findings list view"
      data-testid="run-detail-findings-list-view-toggle"
    >
      {(
        [
          ["table", "Table"],
          ["cards", "Cards"],
        ] as const
      ).map(([viewId, label]) => (
        <button
          key={viewId}
          type="button"
          aria-pressed={activeView === viewId}
          className={cn(
            "rounded-md border px-2 py-1 text-sm",
            activeView === viewId
              ? "border-neutral-500 bg-neutral-100 dark:bg-neutral-800"
              : "border-neutral-200 dark:border-neutral-700",
            OPERATOR_TYPOGRAPHY.helper,
          )}
          onClick={() => {
            setView(viewId);
          }}
          data-testid={`run-detail-findings-list-view-${viewId}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
