"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { commitHrefIfChanged, readWindowLocationSearch } from "@/lib/navigation/replace-if-href-changed";

import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { useProductLine } from "@/components/product-line/ProductLineProvider";
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
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const { productLine } = useProductLine();

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

  const readRouteLocalSearchQuery = useCallback((): string => {
    const params = new URLSearchParams(typeof window === "undefined" ? "" : window.location.search);

    if (routeLocalSearchMode === "reviews-hub") {
      return parseReviewsHubInventorySearchQuery(params.get("q"));
    }

    if (routeLocalSearchMode === "findings-queue") {
      return parseGovernanceFindingsSearchQuery(params.get("q"));
    }

    return "";
  }, [routeLocalSearchMode]);

  const [routeLocalSearchQuery, setRouteLocalSearchQuery] = useState(() => readRouteLocalSearchQuery());

  useEffect(() => {
    const syncRouteLocalSearchQueryFromUrl = (): void => {
      setRouteLocalSearchQuery(readRouteLocalSearchQuery());
    };

    syncRouteLocalSearchQueryFromUrl();
    window.addEventListener("popstate", syncRouteLocalSearchQueryFromUrl);

    return () => {
      window.removeEventListener("popstate", syncRouteLocalSearchQueryFromUrl);
    };
  }, [readRouteLocalSearchQuery]);

  const searchPlaceholder = useMemo(
    () => {
      if (productLine === "security") {
        return resolveShellHeaderSearchPlaceholder(pathname ?? "", productLine);
      }

      return buyerPolishedShell
        ? resolveShellHeaderSearchPlaceholder(pathname ?? "", productLine)
        : GLOBAL_SEARCH_PLACEHOLDER;
    },
    [buyerPolishedShell, pathname, productLine],
  );

  const searchAriaLabel = useMemo(
    () =>
      buyerPolishedShell || productLine === "security"
        ? resolveShellHeaderSearchLabel(pathname ?? "", productLine)
        : GLOBAL_SEARCH_ARIA_LABEL,
    [buyerPolishedShell, pathname, productLine],
  );

  const replaceRouteLocalSearchQuery = useCallback(
    (nextQuery: string) => {
      const path = pathname ?? "";
      setRouteLocalSearchQuery(nextQuery);

      if (routeLocalSearchMode === "reviews-hub") {
        commitHrefIfChanged(
          reviewsHubInventorySearchHrefFromSearch(readWindowLocationSearch(), nextQuery),
          { notify: false },
        );
        return;
      }

      if (routeLocalSearchMode === "findings-queue") {
        commitHrefIfChanged(
          governanceFindingsSearchHrefFromSearch(readWindowLocationSearch(), nextQuery, path),
          { notify: false },
        );
      }
    },
    [pathname, routeLocalSearchMode],
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
