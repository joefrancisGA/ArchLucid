import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";

/** Buyer-polished shell label for `/reviews/new` — avoids conflating review start with artifact upload. */
export const BUYER_NEW_REVIEW_NAV_LABEL = "New review";

/** Operator quick-action label for `/reviews/new` — distinct from Review work "Evidence intake". */
export const OPERATOR_START_REVIEW_QUICK_ACTION_LABEL = "Start review";

export function resolveNewReviewNavLinkLabel(buyerPolishedShell: boolean): string {
  if (buyerPolishedShell) {
    return BUYER_NEW_REVIEW_NAV_LABEL;
  }

  return OPERATOR_NAV_LINK_LABELS.capture;
}

export function resolveNewReviewNavLinkTitle(buyerPolishedShell: boolean): string {
  if (buyerPolishedShell) {
    return "New review — start an architecture review (Quick review, Guided intake, or full wizard) (Alt+N)";
  }

  return "Evidence intake — start a new architecture review (guided wizard through review progress tracking) (Alt+N)";
}

type NavLinkPresentationSource = {
  readonly href: string;
  readonly label: string;
  readonly title: string;
};

export function resolveNavLinkPresentation(
  link: NavLinkPresentationSource,
  buyerPolishedShell: boolean,
): NavLinkPresentationSource {
  if (link.href === "/reviews/new" && buyerPolishedShell) {
    return {
      href: link.href,
      label: resolveNewReviewNavLinkLabel(true),
      title: resolveNewReviewNavLinkTitle(true),
    };
  }

  return link;
}

/** Quick actions use Start review; Review work keeps Evidence intake (or New review in buyer shell). */
export function resolveQuickActionNavLinkPresentation(
  link: NavLinkPresentationSource,
): NavLinkPresentationSource {
  if (link.href === "/reviews/new") {
    return {
      href: link.href,
      label: OPERATOR_START_REVIEW_QUICK_ACTION_LABEL,
      title: "Start review — Quick review, Guided intake, or full wizard (Alt+N)",
    };
  }

  return link;
}
