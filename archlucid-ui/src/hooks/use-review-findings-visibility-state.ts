"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

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

export function useReviewFindingsVisibilityState(): ReviewFindingsVisibilityState {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const urlShowLow = parseReviewFindingsShowLowFromSearch(searchParams?.get(REVIEW_FINDINGS_SHOW_LOW_PARAM));
  const urlShowAdvisory = parseReviewFindingsShowAdvisoryFromSearch(
    searchParams?.get(REVIEW_FINDINGS_SHOW_ADVISORY_PARAM),
  );
  const urlHideGeneric = parseReviewFindingsHideGenericFromSearch(
    searchParams?.get(REVIEW_FINDINGS_HIDE_GENERIC_PARAM),
  );
  const hasUrlShowLow = searchParams?.has(REVIEW_FINDINGS_SHOW_LOW_PARAM) ?? false;
  const hasUrlShowAdvisory = searchParams?.has(REVIEW_FINDINGS_SHOW_ADVISORY_PARAM) ?? false;
  const hasUrlHideGeneric = searchParams?.has(REVIEW_FINDINGS_HIDE_GENERIC_PARAM) ?? false;
  const [accountPrefs] = useState(readFindingsVisibilityFromStorage);
  const [showLowConfidence, setShowLowConfidenceState] = useState(() =>
    resolveFindingsVisibilityFlag(hasUrlShowLow, urlShowLow, accountPrefs.showLowConfidenceEnabled),
  );
  const [showAdvisory, setShowAdvisoryState] = useState(() =>
    resolveFindingsVisibilityFlag(hasUrlShowAdvisory, urlShowAdvisory, accountPrefs.showAdvisoryEnabled),
  );
  const [hideGenericLowDensity, setHideGenericLowDensityState] = useState(() =>
    resolveFindingsVisibilityFlag(hasUrlHideGeneric, urlHideGeneric, accountPrefs.hideGenericEnabled),
  );

  useEffect(() => {
    void syncFindingsVisibilityFromServer();
  }, []);

  useEffect(() => {
    return subscribeFindingsVisibilityChanges(() => {
      const nextPrefs = readFindingsVisibilityFromStorage();

      if (!hasUrlShowLow) {
        setShowLowConfidenceState(nextPrefs.showLowConfidenceEnabled);
      }

      if (!hasUrlShowAdvisory) {
        setShowAdvisoryState(nextPrefs.showAdvisoryEnabled);
      }

      if (!hasUrlHideGeneric) {
        setHideGenericLowDensityState(nextPrefs.hideGenericEnabled);
      }
    });
  }, [hasUrlHideGeneric, hasUrlShowAdvisory, hasUrlShowLow]);

  useEffect(() => {
    if (hasUrlShowLow) {
      setShowLowConfidenceState(urlShowLow);
    }
  }, [hasUrlShowLow, urlShowLow]);

  useEffect(() => {
    if (hasUrlShowAdvisory) {
      setShowAdvisoryState(urlShowAdvisory);
    }
  }, [hasUrlShowAdvisory, urlShowAdvisory]);

  useEffect(() => {
    if (hasUrlHideGeneric) {
      setHideGenericLowDensityState(urlHideGeneric);
    }
  }, [hasUrlHideGeneric, urlHideGeneric]);

  const syncVisibilityToUrl = useCallback(
    (next: { showLowConfidence: boolean; showAdvisory: boolean; hideGenericLowDensity: boolean }) => {
      if (pathname.length === 0) {
        return;
      }

      const nextHref = reviewFindingsVisibilityHrefFromSearch(searchParams.toString(), next, pathname);
      router.replace(nextHref, { scroll: false });
    },
    [pathname, router, searchParams],
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
      setShowLowConfidenceState(next);
      const merged = {
        showLowConfidence: next,
        showAdvisory,
        hideGenericLowDensity,
      };
      syncVisibilityToUrl(merged);
      persistVisibility(merged);
    },
    [hideGenericLowDensity, persistVisibility, showAdvisory, syncVisibilityToUrl],
  );

  const setShowAdvisory = useCallback(
    (next: boolean) => {
      setShowAdvisoryState(next);
      const merged = {
        showLowConfidence,
        showAdvisory: next,
        hideGenericLowDensity,
      };
      syncVisibilityToUrl(merged);
      persistVisibility(merged);
    },
    [hideGenericLowDensity, persistVisibility, showLowConfidence, syncVisibilityToUrl],
  );

  const setHideGenericLowDensity = useCallback(
    (next: boolean) => {
      setHideGenericLowDensityState(next);
      const merged = {
        showLowConfidence,
        showAdvisory,
        hideGenericLowDensity: next,
      };
      syncVisibilityToUrl(merged);
      persistVisibility(merged);
    },
    [persistVisibility, showAdvisory, showLowConfidence, syncVisibilityToUrl],
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
