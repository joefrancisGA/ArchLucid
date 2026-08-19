"use client";

import { useCallback, useEffect, useState } from "react";

import {
  FAVORITE_REVIEWS_STORAGE_KEY,
  addFavoriteReview,
  isFavoriteReview,
  listFavoriteReviews,
  removeFavoriteReview,
  toggleFavoriteReview,
  writeFavoriteReviews,
  type FavoriteReview,
} from "@/lib/favorite-reviews";

export const FAVORITE_REVIEWS_CHANGED_EVENT = "archlucid:favorite-reviews-changed";

export type FavoriteReviewInput = {
  readonly runId: string;
  readonly title?: string;
};

/** Shared favorite-review state for hub rows, detail header, and pinned lists. */
export function useFavoriteReviews(): {
  readonly favorites: FavoriteReview[];
  readonly isFavorite: (runId: string) => boolean;
  readonly toggleFavorite: (entry: FavoriteReviewInput) => void;
  readonly addFavorite: (entry: FavoriteReviewInput) => void;
  readonly removeFavorite: (runId: string) => void;
} {
  const [favorites, setFavorites] = useState<FavoriteReview[]>([]);

  useEffect(() => {
    setFavorites(listFavoriteReviews());

    const refresh = (): void => {
      setFavorites(listFavoriteReviews());
    };

    const onStorage = (event: StorageEvent): void => {
      if (event.key === FAVORITE_REVIEWS_STORAGE_KEY) {
        refresh();
      }
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener(FAVORITE_REVIEWS_CHANGED_EVENT, refresh);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(FAVORITE_REVIEWS_CHANGED_EVENT, refresh);
    };
  }, []);

  const persist = useCallback((next: FavoriteReview[]) => {
    setFavorites(next);
    writeFavoriteReviews(next);
    window.dispatchEvent(new Event(FAVORITE_REVIEWS_CHANGED_EVENT));
  }, []);

  const toggleFavorite = useCallback(
    (entry: FavoriteReviewInput) => {
      persist(toggleFavoriteReview(favorites, entry));
    },
    [favorites, persist],
  );

  const addFavorite = useCallback(
    (entry: FavoriteReviewInput) => {
      persist(addFavoriteReview(favorites, entry));
    },
    [favorites, persist],
  );

  const removeFavorite = useCallback(
    (runId: string) => {
      persist(removeFavoriteReview(favorites, runId));
    },
    [favorites, persist],
  );

  const isFavorite = useCallback(
    (runId: string) => isFavoriteReview(favorites, runId),
    [favorites],
  );

  return { favorites, isFavorite, toggleFavorite, addFavorite, removeFavorite };
}