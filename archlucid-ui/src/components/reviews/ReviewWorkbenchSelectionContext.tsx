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
    props.initialFindingId ?? null,
  );
  const [highlightedNodeId, setHighlightedNodeId] = useState<string | null>(null);
  const [workbenchFocusColumn, setWorkbenchFocusColumnState] = useState<ReviewWorkbenchColumnId | null>(
    props.initialFocusColumn ?? null,
  );

  useEffect(() => {
    if (props.initialFindingId !== undefined) {
      setSelectedFindingIdState(props.initialFindingId);
    }
  }, [props.initialFindingId]);

  const setSelectedFindingId = useCallback(
    (findingId: string | null) => {
      setSelectedFindingIdState(findingId);
      props.onFindingIdChange?.(findingId);
    },
    [props.onFindingIdChange],
  );

  const setWorkbenchFocusColumn = useCallback(
    (column: ReviewWorkbenchColumnId) => {
      setWorkbenchFocusColumnState(column);
      props.onFocusColumnChange?.(column);
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
