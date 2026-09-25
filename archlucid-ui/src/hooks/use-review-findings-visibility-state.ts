"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";

import { commitHrefIfChanged, readWindowLocationSearch } from "@/lib/navigation/replace-if-href-changed";
import {
  persistFindingsVisibilityPreferences,
  readFindingsVisibilityFromStorage,
  resolveFindingsVisibilityFlag,
  subscribeFindingsVisibilityChanges,
  syncFindingsVisibilityFromServer,
} from "@/lib/findings/findings-visibility-preference";
import {
  parseReviewFindingsHideGenericFromSearch,
  parseReviewFindingsShowAdvisoryFromSearch,
  parseReviewFindingsShowLowFromSearch,
  REVIEW_FINDINGS_HIDE_GENERIC_PARAM,
  REVIEW_FINDINGS_SHOW_ADVISORY_PARAM,
  REVIEW_FINDINGS_SHOW_LOW_PARAM,
  reviewFindingsVisibilityHrefFromSearch,
} from "@/lib/findings/review-findings-visibility-url";

export type ReviewFindingsVisibilityState = {
  readonly showLowConfidence: boolean;
  readonly showAdvisory: boolean;
  readonly hideGenericLowDensity: boolean;
  readonly setShowLowConfidence: (next: boolean) => void;
  readonly setShowAdvisory: (next: boolean) => void;
  readonly setHideGenericLowDensity: (next: boolean) => void;
};

type ReviewFindingsVisibilityUrlState = {
  readonly hasUrlShowLow: boolean;
  readonly urlShowLow: boolean;
  readonly hasUrlShowAdvisory: boolean;
  readonly urlShowAdvisory: boolean;
  readonly hasUrlHideGeneric: boolean;
  readonly urlHideGeneric: boolean;
};

function readReviewFindingsVisibilityFromUrl(): ReviewFindingsVisibilityUrlState {
  const params = new URLSearchParams(typeof window === "undefined" ? "" : window.location.search);

  return {
    hasUrlShowLow: params.has(REVIEW_FINDINGS_SHOW_LOW_PARAM),
    urlShowLow: parseReviewFindingsShowLowFromSearch(params.get(REVIEW_FINDINGS_SHOW_LOW_PARAM)),
    hasUrlShowAdvisory: params.has(REVIEW_FINDINGS_SHOW_ADVISORY_PARAM),
    urlShowAdvisory: parseReviewFindingsShowAdvisoryFromSearch(params.get(REVIEW_FINDINGS_SHOW_ADVISORY_PARAM)),
    hasUrlHideGeneric: params.has(REVIEW_FINDINGS_HIDE_GENERIC_PARAM),
    urlHideGeneric: parseReviewFindingsHideGenericFromSearch(params.get(REVIEW_FINDINGS_HIDE_GENERIC_PARAM)),
  };
}

export function useReviewFindingsVisibilityState(): ReviewFindingsVisibilityState {
  const pathname = usePathname() ?? "";
  const { mode: workspaceMode } = useWorkspaceMode();
  const initialUrlState = readReviewFindingsVisibilityFromUrl();
  const [accountPrefs] = useState(() => readFindingsVisibilityFromStorage(workspaceMode));
  const [showLowConfidence, setShowLowConfidenceState] = useState(() =>
    resolveFindingsVisibilityFlag(
      initialUrlState.hasUrlShowLow,
      initialUrlState.urlShowLow,
      accountPrefs.showLowConfidenceEnabled,
    ),
  );
  const [showAdvisory, setShowAdvisoryState] = useState(() =>
    resolveFindingsVisibilityFlag(
      initialUrlState.hasUrlShowAdvisory,
      initialUrlState.urlShowAdvisory,
      accountPrefs.showAdvisoryEnabled,
    ),
  );
  const [hideGenericLowDensity, setHideGenericLowDensityState] = useState(() =>
    resolveFindingsVisibilityFlag(
      initialUrlState.hasUrlHideGeneric,
      initialUrlState.urlHideGeneric,
      accountPrefs.hideGenericEnabled,
    ),
  );
  const showLowConfidenceRef = useRef(showLowConfidence);
  const showAdvisoryRef = useRef(showAdvisory);
  const hideGenericLowDensityRef = useRef(hideGenericLowDensity);
  const urlVisibilityRef = useRef(initialUrlState);

  showLowConfidenceRef.current = showLowConfidence;
  showAdvisoryRef.current = showAdvisory;
  hideGenericLowDensityRef.current = hideGenericLowDensity;

  useEffect(() => {
    void syncFindingsVisibilityFromServer();
  }, []);

  useEffect(() => {
    const syncVisibilityFromUrl = (): void => {
      const nextUrlState = readReviewFindingsVisibilityFromUrl();
      urlVisibilityRef.current = nextUrlState;

      if (nextUrlState.hasUrlShowLow && showLowConfidenceRef.current !== nextUrlState.urlShowLow) {
        showLowConfidenceRef.current = nextUrlState.urlShowLow;
        setShowLowConfidenceState(nextUrlState.urlShowLow);
      }

      if (nextUrlState.hasUrlShowAdvisory && showAdvisoryRef.current !== nextUrlState.urlShowAdvisory) {
        showAdvisoryRef.current = nextUrlState.urlShowAdvisory;
        setShowAdvisoryState(nextUrlState.urlShowAdvisory);
      }

      if (nextUrlState.hasUrlHideGeneric && hideGenericLowDensityRef.current !== nextUrlState.urlHideGeneric) {
        hideGenericLowDensityRef.current = nextUrlState.urlHideGeneric;
        setHideGenericLowDensityState(nextUrlState.urlHideGeneric);
      }
    };

    syncVisibilityFromUrl();
    window.addEventListener("popstate", syncVisibilityFromUrl);

    return () => {
      window.removeEventListener("popstate", syncVisibilityFromUrl);
    };
  }, []);

  useEffect(() => {
    return subscribeFindingsVisibilityChanges(() => {
      const nextPrefs = readFindingsVisibilityFromStorage(workspaceMode);
      const urlState = urlVisibilityRef.current;

      if (!urlState.hasUrlShowLow) {
        showLowConfidenceRef.current = nextPrefs.showLowConfidenceEnabled;
        setShowLowConfidenceState(nextPrefs.showLowConfidenceEnabled);
      }

      if (!urlState.hasUrlShowAdvisory) {
        showAdvisoryRef.current = nextPrefs.showAdvisoryEnabled;
        setShowAdvisoryState(nextPrefs.showAdvisoryEnabled);
      }

      if (!urlState.hasUrlHideGeneric) {
        hideGenericLowDensityRef.current = nextPrefs.hideGenericEnabled;
        setHideGenericLowDensityState(nextPrefs.hideGenericEnabled);
      }
    });
  }, [workspaceMode]);

  const syncVisibilityToUrl = useCallback(
    (next: { showLowConfidence: boolean; showAdvisory: boolean; hideGenericLowDensity: boolean }) => {
      if (pathname.length === 0) {
        return;
      }

      const nextHref = reviewFindingsVisibilityHrefFromSearch(
        readWindowLocationSearch(),
        next,
        pathname,
      );
      commitHrefIfChanged(nextHref, { notify: false });
    },
    [pathname],
  );

  const persistVisibility = useCallback(
    (next: { showLowConfidence: boolean; showAdvisory: boolean; hideGenericLowDensity: boolean }) => {
      void persistFindingsVisibilityPreferences({
        hideGenericEnabled: next.hideGenericLowDensity,
        showLowConfidenceEnabled: next.showLowConfidence,
        showAdvisoryEnabled: next.showAdvisory,
      });
    },
    [],
  );

  const setShowLowConfidence = useCallback(
    (next: boolean) => {
      if (showLowConfidenceRef.current === next) {
        return;
      }

      showLowConfidenceRef.current = next;
      setShowLowConfidenceState(next);
      const merged = {
        showLowConfidence: next,
        showAdvisory: showAdvisoryRef.current,
        hideGenericLowDensity: hideGenericLowDensityRef.current,
      };
      syncVisibilityToUrl(merged);
      persistVisibility(merged);
    },
    [persistVisibility, syncVisibilityToUrl],
  );

  const setShowAdvisory = useCallback(
    (next: boolean) => {
      if (showAdvisoryRef.current === next) {
        return;
      }

      showAdvisoryRef.current = next;
      setShowAdvisoryState(next);
      const merged = {
        showLowConfidence: showLowConfidenceRef.current,
        showAdvisory: next,
        hideGenericLowDensity: hideGenericLowDensityRef.current,
      };
      syncVisibilityToUrl(merged);
      persistVisibility(merged);
    },
    [persistVisibility, syncVisibilityToUrl],
  );

  const setHideGenericLowDensity = useCallback(
    (next: boolean) => {
      if (hideGenericLowDensityRef.current === next) {
        return;
      }

      hideGenericLowDensityRef.current = next;
      setHideGenericLowDensityState(next);
      const merged = {
        showLowConfidence: showLowConfidenceRef.current,
        showAdvisory: showAdvisoryRef.current,
        hideGenericLowDensity: next,
      };
      syncVisibilityToUrl(merged);
      persistVisibility(merged);
    },
    [persistVisibility, syncVisibilityToUrl],
  );

  return {
    showLowConfidence,
    showAdvisory,
    hideGenericLowDensity,
    setShowLowConfidence,
    setShowAdvisory,
    setHideGenericLowDensity,
  };
}
