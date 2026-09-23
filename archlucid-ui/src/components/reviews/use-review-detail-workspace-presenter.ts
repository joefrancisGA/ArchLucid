"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback } from "react";

import { reviewPresenterModeHrefFromSearch } from "@/lib/reviews/review-presenter-mode-url";
import { replaceIfHrefChanged } from "@/lib/navigation/replace-if-href-changed";

export type UseReviewDetailWorkspacePresenterResult = {
  readonly exitPresenter: () => void;
  readonly enterPresenter: () => void;
};

export function useReviewDetailWorkspacePresenter(): UseReviewDetailWorkspacePresenterResult {
  const router = useRouter();
  const pathname = usePathname() ?? "/architecture/reviews";

  const exitPresenter = useCallback(() => {
    replaceIfHrefChanged(
      router,
      reviewPresenterModeHrefFromSearch(window.location.search.slice(1), false, pathname),
    );
  }, [pathname, router]);

  const enterPresenter = useCallback(() => {
    replaceIfHrefChanged(
      router,
      reviewPresenterModeHrefFromSearch(window.location.search.slice(1), true, pathname),
    );
  }, [pathname, router]);

  return { exitPresenter, enterPresenter };
}
