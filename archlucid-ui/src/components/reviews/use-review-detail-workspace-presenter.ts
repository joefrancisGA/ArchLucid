"use client";

import { usePathname } from "next/navigation";
import { useCallback } from "react";

import { reviewPresenterModeHrefFromSearch } from "@/lib/reviews/review-presenter-mode-url";
import { commitHrefIfChanged } from "@/lib/navigation/replace-if-href-changed";

export type UseReviewDetailWorkspacePresenterResult = {
  readonly exitPresenter: () => void;
  readonly enterPresenter: () => void;
};

export function useReviewDetailWorkspacePresenter(): UseReviewDetailWorkspacePresenterResult {
  const pathname = usePathname() ?? "/architecture/reviews";

  const exitPresenter = useCallback(() => {
    commitHrefIfChanged(
      reviewPresenterModeHrefFromSearch(window.location.search.slice(1), false, pathname),
      { notify: false },
    );
  }, [pathname]);

  const enterPresenter = useCallback(() => {
    commitHrefIfChanged(
      reviewPresenterModeHrefFromSearch(window.location.search.slice(1), true, pathname),
      { notify: false },
    );
  }, [pathname]);

  return { exitPresenter, enterPresenter };
}
