"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ReactElement } from "react";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  defaultReviewFindingsListView,
  parseReviewFindingsListViewFromSearch,
  reviewFindingsListViewHrefFromSearch,
  type ReviewFindingsListViewKind,
} from "@/lib/findings/review-findings-list-view";
import { commitHrefIfChanged, readWindowLocationSearch } from "@/lib/navigation/replace-if-href-changed";
import { cn } from "@/lib/utils";

export type RunDetailFindingsListViewToggleProps = {
  readonly workingMode: boolean;
};

export function RunDetailFindingsListViewToggle(props: RunDetailFindingsListViewToggleProps): ReactElement {
  const pathname = usePathname() ?? "";
  const readActiveView = (): ReviewFindingsListViewKind => {
    const fromUrl = parseReviewFindingsListViewFromSearch(
      typeof window === "undefined"
        ? null
        : new URLSearchParams(window.location.search).get("findingsListView"),
    );

    return fromUrl ?? defaultReviewFindingsListView(props.workingMode);
  };
  const [activeView, setActiveViewState] = useState<ReviewFindingsListViewKind>(() => readActiveView());
  const activeViewRef = useRef(activeView);
  activeViewRef.current = activeView;

  const setView = useCallback(
    (next: ReviewFindingsListViewKind) => {
      if (activeViewRef.current === next) {
        return;
      }

      activeViewRef.current = next;
      setActiveViewState(next);
      commitHrefIfChanged(
        reviewFindingsListViewHrefFromSearch(readWindowLocationSearch(), next, pathname),
        { notify: false },
      );
    },
    [pathname],
  );

  useEffect(() => {
    const syncViewFromUrl = (): void => {
      const next = readActiveView();

      if (activeViewRef.current === next) {
        return;
      }

      activeViewRef.current = next;
      setActiveViewState(next);
    };

    syncViewFromUrl();
    window.addEventListener("popstate", syncViewFromUrl);

    return () => {
      window.removeEventListener("popstate", syncViewFromUrl);
    };
  }, [props.workingMode]);

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
