export type ReviewDetailSectionSearchMatch = {
  readonly sectionId: string;
  readonly label: string;
};

/** Review workspace detail routes (not the reviews hub inventory list). */
export function isReviewDetailHeaderSearchPath(pathname: string): boolean {
  const path = (pathname ?? "").split("?")[0]?.replace(/\/$/, "") ?? "";

  if (path === "/architecture/reviews" || path === "/architecture/reviews/new") {
    return false;
  }

  if (/^\/architecture\/reviews\/[^/]+(?:\/|$)/u.test(path)) {
    return true;
  }

  return /^\/architecture\/architectures\/[^/]+\/reviews\/[^/]+(?:\/|$)/u.test(path);
}

/** Matches visible "On this page" section links for review-detail header search. */
export function findReviewDetailSectionSearchMatches(query: string): ReviewDetailSectionSearchMatch[] {
  if (typeof document === "undefined") {
    return [];
  }

  const trimmed = query.trim().toLowerCase();

  if (trimmed.length === 0) {
    return [];
  }

  const nav = document.querySelector('nav[aria-label="On this page sections"]');

  if (nav === null) {
    return [];
  }

  const matches: ReviewDetailSectionSearchMatch[] = [];

  nav.querySelectorAll<HTMLAnchorElement>("a[href^='#']").forEach((anchor) => {
    const sectionId = anchor.getAttribute("href")?.replace(/^#/, "").trim() ?? "";
    const label = anchor.textContent?.trim() ?? "";

    if (sectionId.length === 0 || label.length === 0) {
      return;
    }

    if (!label.toLowerCase().includes(trimmed)) {
      return;
    }

    matches.push({ sectionId, label });
  });

  return matches;
}
