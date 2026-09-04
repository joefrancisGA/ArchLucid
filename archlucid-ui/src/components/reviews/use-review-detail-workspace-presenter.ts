"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

import { reviewPresenterModeHrefFromSearch } from "@/lib/reviews/review-presenter-mode-url";

export type UseReviewDetailWorkspacePresenterResult = {
  readonly exitPresenter: () => void;
  readonly enterPresenter: () => void;
};

export function useReviewDetailWorkspacePresenter(): UseReviewDetailWorkspacePresenterResult {
  const router = useRouter();
  const pathname = usePathname() ?? "/architecture/reviews";
  const searchParams = useSearchParams();

  const exitPresenter = useCallback(() => {
    router.replace(reviewPresenterModeHrefFromSearch(searchParams.toString(), false, pathname), { scroll: false });
  }, [pathname, router, searchParams]);

  const enterPresenter = useCallback(() => {
    router.replace(reviewPresenterModeHrefFromSearch(searchParams.toString(), true, pathname), { scroll: false });
  }, [pathname, router, searchParams]);

  return { exitPresenter, enterPresenter };
}
