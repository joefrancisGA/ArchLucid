"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode} from "react";

import type { ReviewWorkbenchColumnId } from "@/components/reviews/ReviewWorkbenchLayout";
import {
  readReviewDetailFindingIdFromWindowLocation} from "@/lib/review-detail-workspace-tabs";

export type ReviewWorkbenchSelectionContextValue = {
  readonly selectedFindingId: string | null;
  readonly highlightedNodeId: string | null;
  readonly setSelectedFindingId: (findingId: string | null) => void;
  /** Updates selection state without rewriting the address bar (DOM/URL listener reconciliation). */
  readonly reconcileSelectedFindingId: (findingId: string | null) => void;
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
  const initialSelectedFindingId =
    readReviewDetailFindingIdFromWindowLocation() ?? props.initialFindingId ?? null;
  const [selectedFindingId, setSelectedFindingIdState] = useState<string | null>(initialSelectedFindingId);
  const selectedFindingIdRef = useRef(initialSelectedFindingId);
  const [highlightedNodeId, setHighlightedNodeIdState] = useState<string | null>(null);
  const initialWorkbenchFocusColumn = props.initialFocusColumn ?? null;
  const [workbenchFocusColumn, setWorkbenchFocusColumnState] = useState<ReviewWorkbenchColumnId | null>(
    initialWorkbenchFocusColumn,
  );
  const workbenchFocusColumnRef = useRef(initialWorkbenchFocusColumn);
  const onFindingIdChangeRef = useRef(props.onFindingIdChange);
  const onFocusColumnChangeRef = useRef(props.onFocusColumnChange);

  selectedFindingIdRef.current = selectedFindingId;
  workbenchFocusColumnRef.current = workbenchFocusColumn;
  onFindingIdChangeRef.current = props.onFindingIdChange;
  onFocusColumnChangeRef.current = props.onFocusColumnChange;

  useEffect(() => {
    const syncFindingIdFromUrl = (): void => {
      const urlFindingId = readReviewDetailFindingIdFromWindowLocation();

      if (selectedFindingIdRef.current === urlFindingId) {
        return;
      }

      selectedFindingIdRef.current = urlFindingId;
      setSelectedFindingIdState(urlFindingId);
    };

    syncFindingIdFromUrl();
    window.addEventListener("popstate", syncFindingIdFromUrl);

    return () => {
      window.removeEventListener("popstate", syncFindingIdFromUrl);
    };
  }, []);

  const setSelectedFindingId = useCallback((findingId: string | null) => {
    if (selectedFindingIdRef.current === findingId) {
      return;
    }

    selectedFindingIdRef.current = findingId;
    setSelectedFindingIdState(findingId);
    onFindingIdChangeRef.current?.(findingId);
  }, []);

  const reconcileSelectedFindingId = useCallback((findingId: string | null) => {
    if (selectedFindingIdRef.current === findingId) {
      return;
    }

    selectedFindingIdRef.current = findingId;
    setSelectedFindingIdState(findingId);
  }, []);

  const setHighlightedNodeId = useCallback((nodeId: string | null) => {
    setHighlightedNodeIdState((current) => (current === nodeId ? current : nodeId));
  }, []);

  const setWorkbenchFocusColumn = useCallback((column: ReviewWorkbenchColumnId) => {
    if (workbenchFocusColumnRef.current === column) {
      return;
    }

    workbenchFocusColumnRef.current = column;
    setWorkbenchFocusColumnState(column);
    onFocusColumnChangeRef.current?.(column);
  }, []);

  const value = useMemo<ReviewWorkbenchSelectionContextValue>(
    () => ({
      selectedFindingId,
      highlightedNodeId,
      setSelectedFindingId,
      reconcileSelectedFindingId,
      setHighlightedNodeId,
      workbenchFocusColumn,
      setWorkbenchFocusColumn}),
    [
      highlightedNodeId,
      reconcileSelectedFindingId,
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
