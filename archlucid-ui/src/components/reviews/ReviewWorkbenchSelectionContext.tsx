"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { ReviewWorkbenchColumnId } from "@/components/reviews/ReviewWorkbenchLayout";
import {
  readReviewDetailFindingIdFromWindowLocation,
  REVIEW_DETAIL_URL_CHANGED_EVENT,
} from "@/lib/review-detail-workspace-tabs";

export type ReviewWorkbenchSelectionContextValue = {
  readonly selectedFindingId: string | null;
  readonly highlightedNodeId: string | null;
  readonly setSelectedFindingId: (findingId: string | null) => void;
  readonly setHighlightedNodeId: (nodeId: string | null) => void;
  readonly workbenchFocusColumn: ReviewWorkbenchColumnId | null;
  readonly setWorkbenchFocusColumn: (column: ReviewWorkbenchColumnId) => void;
};

const ReviewWorkbenchSelectionContext = createContext<ReviewWorkbenchSelectionContextValue | null>(null);

export type ReviewWorkbenchSelectionProviderProps = {
  readonly children: ReactNode;
  readonly initialFindingId?: string | null;
  readonly initialFocusColumn?: ReviewWorkbenchColumnId | null;
  readonly onFindingIdChange?: (findingId: string | null) => void;
  readonly onFocusColumnChange?: (column: ReviewWorkbenchColumnId) => void;
};

/** Shared finding + column selection for the Working-mode three-column workbench (PT-12). */
export function ReviewWorkbenchSelectionProvider(props: ReviewWorkbenchSelectionProviderProps): React.JSX.Element {
  const [selectedFindingId, setSelectedFindingIdState] = useState<string | null>(
    () => readReviewDetailFindingIdFromWindowLocation() ?? props.initialFindingId ?? null,
  );
  const [highlightedNodeId, setHighlightedNodeIdState] = useState<string | null>(null);
  const [workbenchFocusColumn, setWorkbenchFocusColumnState] = useState<ReviewWorkbenchColumnId | null>(
    props.initialFocusColumn ?? null,
  );

  useEffect(() => {
    const syncFindingIdFromUrl = (): void => {
      const urlFindingId = readReviewDetailFindingIdFromWindowLocation();

      setSelectedFindingIdState((current) => (current === urlFindingId ? current : urlFindingId));
    };

    syncFindingIdFromUrl();
    window.addEventListener("popstate", syncFindingIdFromUrl);
    window.addEventListener(REVIEW_DETAIL_URL_CHANGED_EVENT, syncFindingIdFromUrl);

    return () => {
      window.removeEventListener("popstate", syncFindingIdFromUrl);
      window.removeEventListener(REVIEW_DETAIL_URL_CHANGED_EVENT, syncFindingIdFromUrl);
    };
  }, []);

  const setSelectedFindingId = useCallback(
    (findingId: string | null) => {
      setSelectedFindingIdState((current) => {
        if (current === findingId) {
          return current;
        }

        props.onFindingIdChange?.(findingId);
        return findingId;
      });
    },
    [props.onFindingIdChange],
  );

  const setHighlightedNodeId = useCallback((nodeId: string | null) => {
    setHighlightedNodeIdState((current) => (current === nodeId ? current : nodeId));
  }, []);

  const setWorkbenchFocusColumn = useCallback(
    (column: ReviewWorkbenchColumnId) => {
      setWorkbenchFocusColumnState((current) => {
        if (current === column) {
          return current;
        }

        props.onFocusColumnChange?.(column);
        return column;
      });
    },
    [props.onFocusColumnChange],
  );

  const value = useMemo<ReviewWorkbenchSelectionContextValue>(
    () => ({
      selectedFindingId,
      highlightedNodeId,
      setSelectedFindingId,
      setHighlightedNodeId,
      workbenchFocusColumn,
      setWorkbenchFocusColumn,
    }),
    [
      highlightedNodeId,
      selectedFindingId,
      setHighlightedNodeId,
      setSelectedFindingId,
      setWorkbenchFocusColumn,
      workbenchFocusColumn,
    ],
  );

  return (
    <ReviewWorkbenchSelectionContext.Provider value={value}>
      {props.children}
    </ReviewWorkbenchSelectionContext.Provider>
  );
}

export function useReviewWorkbenchSelection(): ReviewWorkbenchSelectionContextValue | null {
  return useContext(ReviewWorkbenchSelectionContext);
}
