const REVIEWS_LIST_RETURN_HREF_KEY = "archlucid_reviews_list_return_href_v1";

/** Persists the reviews list URL (including filters) so detail breadcrumbs can return to the same view. */
export function persistReviewsListReturnHref(href: string): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(REVIEWS_LIST_RETURN_HREF_KEY, href);
  } catch {
    /* private mode */
  }
}

export function readReviewsListReturnHref(): string {
  if (typeof window === "undefined") {
    return "/architecture/reviews";
  }

  try {
    const raw = window.localStorage.getItem(REVIEWS_LIST_RETURN_HREF_KEY)?.trim();

    if (raw !== undefined && raw.length > 0 && raw.startsWith("/architecture/reviews")) {
      return raw;
    }
  } catch {
    /* private mode */
  }

  return "/architecture/reviews";
}
