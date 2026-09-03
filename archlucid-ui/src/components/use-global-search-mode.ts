"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo } from "react";

import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  GLOBAL_SEARCH_ARIA_LABEL,
  GLOBAL_SEARCH_PLACEHOLDER,
} from "@/lib/keyboard-shortcut-display";
import {
  governanceFindingsSearchHrefFromSearch,
  parseGovernanceFindingsSearchQuery,
} from "@/lib/governance/governance-findings-queue-search";
import {
  isGovernanceFindingsQueueHeaderSearchPath,
  isReviewsHubInventoryHeaderSearchPath,
} from "@/lib/shell-header-route-local-search";
import { isReviewDetailHeaderSearchPath } from "@/lib/review-detail-header-section-search";
import {
  parseReviewsHubInventorySearchQuery,
  reviewsHubInventorySearchHrefFromSearch,
} from "@/app/(operator)/architecture/reviews/_sections/reviews-hub-inventory-filters";
import {
  resolveShellHeaderSearchLabel,
  resolveShellHeaderSearchPlaceholder,
} from "@/lib/shell-header-search-label";
import type { RouteLocalSearchMode } from "@/components/use-global-search-results";

export function useGlobalSearchMode() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  const routeLocalSearchMode = useMemo((): RouteLocalSearchMode => {
    const path = pathname ?? "";

    if (isReviewsHubInventoryHeaderSearchPath(path)) {
      return "reviews-hub";
    }

    if (isGovernanceFindingsQueueHeaderSearchPath(path)) {
      return "findings-queue";
    }

    if (isReviewDetailHeaderSearchPath(path)) {
      return "review-detail";
    }

    return null;
  }, [pathname]);

  const routeLocalSearchQuery = useMemo(() => {
    if (routeLocalSearchMode === "reviews-hub") {
      return parseReviewsHubInventorySearchQuery(searchParams.get("q"));
    }

    if (routeLocalSearchMode === "findings-queue") {
      return parseGovernanceFindingsSearchQuery(searchParams.get("q"));
    }

    return "";
  }, [routeLocalSearchMode, searchParams]);

  const searchPlaceholder = useMemo(
    () =>
      buyerPolishedShell
        ? resolveShellHeaderSearchPlaceholder(pathname ?? "")
        : GLOBAL_SEARCH_PLACEHOLDER,
    [buyerPolishedShell, pathname],
  );

  const searchAriaLabel = useMemo(
    () => (buyerPolishedShell ? resolveShellHeaderSearchLabel(pathname ?? "") : GLOBAL_SEARCH_ARIA_LABEL),
    [buyerPolishedShell, pathname],
  );

  const replaceRouteLocalSearchQuery = useCallback(
    (nextQuery: string) => {
      const path = pathname ?? "";

      if (routeLocalSearchMode === "reviews-hub") {
        router.replace(reviewsHubInventorySearchHrefFromSearch(searchParams.toString(), nextQuery), {
          scroll: false,
        });
        return;
      }

      if (routeLocalSearchMode === "findings-queue") {
        router.replace(
          governanceFindingsSearchHrefFromSearch(searchParams.toString(), nextQuery, path),
          { scroll: false },
        );
      }
    },
    [pathname, routeLocalSearchMode, router, searchParams],
  );

  return {
    routeLocalSearchMode,
    routeLocalSearchQuery,
    searchPlaceholder,
    searchAriaLabel,
    replaceRouteLocalSearchQuery,
  };
}

export function useGlobalSearchRouteLocalQuerySync(
  routeLocalSearchMode: RouteLocalSearchMode,
  routeLocalSearchQuery: string,
  query: string,
  setQuery: (next: string) => void,
  replaceRouteLocalSearchQuery: (nextQuery: string) => void,
) {
  useEffect(() => {
    if (routeLocalSearchMode === "reviews-hub" || routeLocalSearchMode === "findings-queue") {
      setQuery(routeLocalSearchQuery);
    }
  }, [routeLocalSearchMode, routeLocalSearchQuery, setQuery]);

  useEffect(() => {
    if (routeLocalSearchMode === null || routeLocalSearchMode === "review-detail") {
      return;
    }

    const timer = window.setTimeout(() => {
      replaceRouteLocalSearchQuery(query);
    }, 250);

    return () => window.clearTimeout(timer);
  }, [query, replaceRouteLocalSearchQuery, routeLocalSearchMode]);
}
