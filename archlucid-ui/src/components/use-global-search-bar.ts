"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState, type SetStateAction } from "react";

import { palettePressUsesPaletteModifier } from "@/components/CommandPalette";
import { dispatchOpenCommandPalette } from "@/lib/shortcut-registry";
import { useGlobalSearchMode, useGlobalSearchRouteLocalQuerySync } from "@/components/use-global-search-mode";
import { useGlobalSearchResults } from "@/components/use-global-search-results";
import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import {
  resolveGlobalSearchFindingHref,
  resolveGlobalSearchRunHref,
} from "@/lib/global-search-inhabited-navigation";
import { useReviewPackageSearchScope } from "@/hooks/use-review-package-search-scope";
import {
  globalSearchBarOverlayHrefFromSearch,
  isGlobalSearchBarOverlayHrefCurrent,
  parseGlobalSearchBarOpenFromSearch,
} from "@/lib/operator/global-search-bar-overlay-url";
import { commitHrefIfChanged } from "@/lib/navigation/replace-if-href-changed";

export const OPEN_GLOBAL_SEARCH_EVENT = "archlucid-open-global-search";
export const FOCUS_GLOBAL_SEARCH_EVENT = "archlucid-focus-global-search";

export type GlobalSearchBarController = ReturnType<typeof useGlobalSearchBar>;

export function useGlobalSearchBar() {
  const inputId = useId();
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const globalSearchOpenParam = searchParams?.get("globalSearchOpen") ?? null;
  const urlOpen = parseGlobalSearchBarOpenFromSearch(globalSearchOpenParam);
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpenState] = useState(urlOpen);

  const syncGlobalSearchOpenToUrl = useCallback(
    (panelOpen: boolean) => {
      const currentSearch = window.location.search.slice(1);

      if (isGlobalSearchBarOverlayHrefCurrent(currentSearch, panelOpen, pathname)) {
        return;
      }

      commitHrefIfChanged(globalSearchBarOverlayHrefFromSearch(currentSearch, panelOpen, pathname), {
        notify: false,
      });
    },
    [pathname],
  );

  const setOpen = useCallback(
    (value: SetStateAction<boolean>) => {
      setOpenState((current) => {
        const next = typeof value === "function" ? value(current) : value;

        if (next !== current) {
          syncGlobalSearchOpenToUrl(next);
        }

        return next;
      });
    },
    [syncGlobalSearchOpenToUrl],
  );

  useEffect(() => {
    const syncGlobalSearchOpenFromUrl = (): void => {
      const nextOpen = parseGlobalSearchBarOpenFromSearch(
        new URLSearchParams(window.location.search).get("globalSearchOpen"),
      );

      setOpenState((current) => (current === nextOpen ? current : nextOpen));
    };

    syncGlobalSearchOpenFromUrl();
    window.addEventListener("popstate", syncGlobalSearchOpenFromUrl);

    return () => {
      window.removeEventListener("popstate", syncGlobalSearchOpenFromUrl);
    };
  }, []);

  const {
    routeLocalSearchMode,
    routeLocalSearchQuery,
    searchPlaceholder: routeSearchPlaceholder,
    searchAriaLabel: routeSearchAriaLabel,
    replaceRouteLocalSearchQuery,
  } = useGlobalSearchMode();

  const { isWorkingMode } = useWorkspaceMode();
  const packageSearchScope = useReviewPackageSearchScope();

  const searchResults = useGlobalSearchResults(query, routeLocalSearchMode, {
    packageRunId: packageSearchScope.packageRunId,
    searchScope: packageSearchScope.searchScope,
    architectureScopedRunIds: packageSearchScope.architectureScopedRunIds,
  });

  const searchPlaceholder =
    packageSearchScope.packageScopeAvailable
      ? packageSearchScope.searchPlaceholder
      : routeSearchPlaceholder;
  const searchAriaLabel =
    packageSearchScope.packageScopeAvailable
      ? packageSearchScope.searchAriaLabel
      : routeSearchAriaLabel;

  useGlobalSearchRouteLocalQuerySync(
    routeLocalSearchMode,
    routeLocalSearchQuery,
    query,
    setQuery,
    replaceRouteLocalSearchQuery,
  );

  const closePanel = useCallback(() => {
    setOpen(false);
  }, [setOpen]);

  useEffect(() => {
    function focusInput(): void {
      setOpen(true);
      inputRef.current?.focus();
    }

    function onOpen() {
      setOpen(true);
      window.requestAnimationFrame(() => inputRef.current?.focus());
    }

    function onFocus() {
      focusInput();
    }

    function focusFromFindAPageHash(): void {
      if (window.location.hash !== "#find-a-page") {
        return;
      }

      window.requestAnimationFrame(() => focusInput());
    }

    focusFromFindAPageHash();
    window.addEventListener(OPEN_GLOBAL_SEARCH_EVENT, onOpen);
    window.addEventListener(FOCUS_GLOBAL_SEARCH_EVENT, onFocus);
    window.addEventListener("hashchange", focusFromFindAPageHash);

    return () => {
      window.removeEventListener(OPEN_GLOBAL_SEARCH_EVENT, onOpen);
      window.removeEventListener(FOCUS_GLOBAL_SEARCH_EVENT, onFocus);
      window.removeEventListener("hashchange", focusFromFindAPageHash);
    };
  }, [setOpen]);

  useEffect(() => {
    function onDocClick(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [setOpen]);

  const showQuickActions = open && searchResults.trimmedQuery.length < 2 && routeLocalSearchMode === null;
  const packageResultsPanelOpen =
    open &&
    routeLocalSearchMode === "review-detail" &&
    packageSearchScope.searchScope === "package" &&
    searchResults.trimmedQuery.length >= 2;
  const reviewDetailPanelOpen =
    open &&
    routeLocalSearchMode === "review-detail" &&
    searchResults.trimmedQuery.length > 0 &&
    searchResults.trimmedQuery.length < 2;
  const globalResultsPanelOpen =
    open &&
    searchResults.trimmedQuery.length >= 2 &&
    (routeLocalSearchMode === null ||
      (routeLocalSearchMode === "review-detail" && packageSearchScope.searchScope === "workspace"));
  const resultsPanelOpen = globalResultsPanelOpen || reviewDetailPanelOpen || packageResultsPanelOpen;
  const quickActionsPanelOpen = showQuickActions;

  const handleQueryChange = useCallback(
    (nextQuery: string) => {
      setQuery(nextQuery);
      setOpen(routeLocalSearchMode === null || routeLocalSearchMode === "review-detail");
    },
    [routeLocalSearchMode, setOpen],
  );

  const handleInputFocus = useCallback(() => {
    setOpen(routeLocalSearchMode === null ? true : open || routeLocalSearchMode === "review-detail");
  }, [open, routeLocalSearchMode, setOpen]);

  const handleInputKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key?.toLowerCase() !== "k") {
        return;
      }

      if (!palettePressUsesPaletteModifier(event, event.target)) {
        return;
      }

      event.preventDefault();
      setOpen(false);
      dispatchOpenCommandPalette(query);
    },
    [query, setOpen],
  );

  const navigateToRun = useCallback(
    (runId: string, architectureId?: string | null) => {
      const href = resolveGlobalSearchRunHref(runId, {
        isWorkingMode,
        architectureId,
      });
      router.push(href);
      closePanel();
    },
    [closePanel, isWorkingMode, router],
  );

  const navigateToFinding = useCallback(
    (runId: string, findingId: string, architectureId?: string | null) => {
      const href = resolveGlobalSearchFindingHref(runId, findingId, {
        isWorkingMode,
        architectureId,
      });
      router.push(href);
      closePanel();
    },
    [closePanel, isWorkingMode, router],
  );

  const resolveFindingHref = useCallback(
    (runId: string, findingId: string, architectureId?: string | null) =>
      resolveGlobalSearchFindingHref(runId, findingId, {
        isWorkingMode,
        architectureId: architectureId ?? packageSearchScope.architectureId,
      }),
    [isWorkingMode, packageSearchScope.architectureId],
  );

  return {
    inputId,
    inputRef,
    rootRef,
    query,
    searchPlaceholder,
    searchAriaLabel,
    routeLocalSearchMode,
    packageSearchScope,
    searchResults,
    quickActionsPanelOpen,
    reviewDetailPanelOpen,
    packageResultsPanelOpen,
    globalResultsPanelOpen,
    resultsPanelOpen,
    closePanel,
    handleQueryChange,
    handleInputFocus,
    handleInputKeyDown,
    navigateToRun,
    navigateToFinding,
    resolveFindingHref,
  };
}
