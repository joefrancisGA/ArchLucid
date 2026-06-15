import { applyBuyerDemoVocabulary } from "@/lib/buyer-demo-vocabulary";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";

/** Buyer-polished shell label for `/reviews/new` — avoids conflating review start with artifact upload. */
export const BUYER_NEW_REVIEW_NAV_LABEL = "New review";

/** Operator quick-action label for `/reviews/new` — keep the outcome verb in default shell chrome. */
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

  return "Start review — Quick review, Guided intake, or full wizard (Alt+N)";
}

type NavLinkPresentationSource = {
  readonly href: string;
  readonly label: string;
  readonly title: string;
};

function applyBuyerNavVocabulary(presentation: NavLinkPresentationSource): NavLinkPresentationSource {
  return {
    href: presentation.href,
    label: applyBuyerDemoVocabulary(presentation.label),
    title: applyBuyerDemoVocabulary(presentation.title),
  };
}

export function resolveNavLinkPresentation(
  link: NavLinkPresentationSource,
  buyerPolishedShell: boolean,
): NavLinkPresentationSource {
  if (link.href === "/reviews/new" && buyerPolishedShell) {
    return applyBuyerNavVocabulary({
      href: link.href,
      label: resolveNewReviewNavLinkLabel(true),
      title: resolveNewReviewNavLinkTitle(true),
    });
  }

  return applyBuyerNavVocabulary(link);
}

/** Quick actions use Start review; buyer shell may still prefer New review. */
export function resolveQuickActionNavLinkPresentation(
  link: NavLinkPresentationSource,
): NavLinkPresentationSource {
  if (link.href === "/reviews/new") {
    return applyBuyerNavVocabulary({
      href: link.href,
      label: OPERATOR_START_REVIEW_QUICK_ACTION_LABEL,
      title: "Start review — Quick review, Guided intake, or full wizard (Alt+N)",
    });
  }

  return applyBuyerNavVocabulary(link);
}
