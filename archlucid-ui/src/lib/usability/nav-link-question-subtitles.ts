/**
 * One-line "question this surface answers" subtitles for sidebar nav links (usability batch).
 */

export type NavLinkQuestionSubtitle = {
  readonly href: string;
  readonly subtitle: string;
};

/**
 * Subtitles only for nav items whose label alone doesn't convey scope.
 * Keep this list short — dense helper copy makes the sidebar typographically busy.
 */
export const NAV_LINK_QUESTION_SUBTITLES: readonly NavLinkQuestionSubtitle[] = [
  { href: "/compare", subtitle: "What changed between two reviews?" },
  { href: "/insights/ask-review-questions", subtitle: "Query this review in plain language" },
] as const;

export function navLinkQuestionSubtitle(href: string): string | null {
  const path = href.split("?")[0] ?? "";

  for (const row of NAV_LINK_QUESTION_SUBTITLES) {
    if (path === row.href) {
      return row.subtitle;
    }
  }

  return null;
}
