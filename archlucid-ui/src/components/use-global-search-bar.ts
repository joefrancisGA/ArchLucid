"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState, type SetStateAction } from "react";

import { palettePressUsesPaletteModifier } from "@/components/CommandPalette";
import { dispatchOpenCommandPalette } from "@/lib/shortcut-registry";
import { useGlobalSearchMode, useGlobalSearchRouteLocalQuerySync } from "@/components/use-global-search-mode";
import { useGlobalSearchResults } from "@/components/use-global-search-results";
import { useReviewPackageSearchScope } from "@/hooks/use-review-package-search-scope";
import {
  globalSearchBarOverlayHrefFromSearch,
  isGlobalSearchBarOverlayHrefCurrent,
  parseGlobalSearchBarOpenFromSearch,
} from "@/lib/operator/global-search-bar-overlay-url";

export const OPEN_GLOBAL_SEARCH_EVENT = "archlucid-open-global-search";
export const FOCUS_GLOBAL_SEARCH_EVENT = "archlucid-focus-global-search";

export type GlobalSearchBarController = ReturnType<typeof useGlobalSearchBar>;

export function useGlobalSearchBar() {
  const inputId = useId();
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const currentSearch = searchParams?.toString() ?? "";
  const globalSearchOpenParam = searchParams?.get("globalSearchOpen") ?? null;
  const urlOpen = parseGlobalSearchBarOpenFromSearch(globalSearchOpenParam);
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const previousUrlOpenRef = useRef(urlOpen);
  const [query, setQuery] = useState("");
  const [open, setOpenState] = useState(urlOpen);

  const syncGlobalSearchOpenToUrl = useCallback(
    (panelOpen: boolean) => {
      if (isGlobalSearchBarOverlayHrefCurrent(currentSearch, panelOpen, pathname)) {
        return;
      }

      router.replace(globalSearchBarOverlayHrefFromSearch(currentSearch, panelOpen, pathname), {
        scroll: false,
      });
    },
    [currentSearch, pathname, router],
  );

  const setOpen = useCallback((value: SetStateAction<boolean>) => {
    setOpenState((current) => (typeof value === "function" ? value(current) : value));
  }, []);

  useEffect(() => {
    // Keep router.replace out of the open-state updater. React runs updaters during
    // render, and replacing the URL would update Router while GlobalSearchBar renders.
    // Depend on the parsed flag, not searchParams identity, so a new params object
    // cannot look like an external close and collapse the panel.

    if (previousUrlOpenRef.current !== urlOpen) {
      previousUrlOpenRef.current = urlOpen;

      if (urlOpen !== open) {
        setOpenState(urlOpen);
      }

      return;
    }

    if (urlOpen === open) {
      return;
    }

    syncGlobalSearchOpenToUrl(open);
  }, [open, syncGlobalSearchOpenToUrl, urlOpen]);

  const {
    routeLocalSearchMode,
    routeLocalSearchQuery,
    searchPlaceholder: routeSearchPlaceholder,
    searchAriaLabel: routeSearchAriaLabel,
    replaceRouteLocalSearchQuery,
  } = useGlobalSearchMode();

  const packageSearchScope = useReviewPackageSearchScope();

  const searchResults = useGlobalSearchResults(query, routeLocalSearchMode, {
    packageRunId: packageSearchScope.packageRunId,
    searchScope: packageSearchScope.searchScope,
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
    (runId: string) => {
      router.push(`/architecture/reviews/${encodeURIComponent(runId)}`);
      closePanel();
    },
    [closePanel, router],
  );

  const navigateToFinding = useCallback(
    (runId: string, findingId: string) => {
      router.push(
        `/architecture/reviews/${encodeURIComponent(runId)}/findings/${encodeURIComponent(findingId)}`,
      );
      closePanel();
    },
    [closePanel, router],
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
  };
}
