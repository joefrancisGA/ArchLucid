/**
 * One-line "question this surface answers" subtitles for sidebar nav links (usability batch).
 */

export type NavLinkQuestionSubtitle = {
  readonly href: string;
  readonly subtitle: string;
};

export const NAV_LINK_QUESTION_SUBTITLES: readonly NavLinkQuestionSubtitle[] = [
  { href: "/compare", subtitle: "What changed between two reviews?" },
  { href: "/replay", subtitle: "Does stored output still validate?" },
  { href: "/graph", subtitle: "How does provenance look for this review?" },
  { href: "/ask", subtitle: "Query this review in plain language" },
  { href: "/search", subtitle: "Find reviews, findings, and evidence" },
  { href: "/advisory", subtitle: "What should we change next?" },
  { href: "/governance", subtitle: "What needs a governance decision?" },
  { href: "/governance/findings", subtitle: "Which findings need disposition?" },
  { href: "/audit", subtitle: "Who did what, and when?" },
  { href: "/alerts", subtitle: "What needs attention right now?" },
  { href: "/policy-packs", subtitle: "Which rules drive findings?" },
  { href: "/value-report", subtitle: "What value did reviews deliver?" },
  { href: "/reviews/new", subtitle: "Start a new architecture review" },
  { href: "/reviews", subtitle: "Browse committed architecture reviews" },
  { href: "/dashboard", subtitle: "Portfolio ROI and compliance drift for sponsors" },
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
