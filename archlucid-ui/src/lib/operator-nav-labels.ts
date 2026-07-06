import { applyBuyerDemoVocabulary } from "@/lib/buyer-demo-vocabulary";
import { isBuyerVocabularyPassActive } from "@/lib/demo-ui-env";
import { governanceModeVocabulary } from "@/lib/governance-mode-vocabulary";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";

/** Buyer-polished shell left-nav label for `/reviews/new` — navigation destination, not the hero CTA. */
export const BUYER_NEW_REVIEW_NAV_LABEL = "New review";

/** Operator quick-action label for `/reviews/new` — keep the outcome verb in default shell chrome. */
export const OPERATOR_START_REVIEW_QUICK_ACTION_LABEL = "Start review";

/** Default left-nav label for `/reviews/new` when buyer vocabulary pass is active (TB-646). */
export const NEW_REVIEW_NAV_LINK_LABEL = BUYER_NEW_REVIEW_NAV_LABEL;

const NEW_REVIEW_NAV_TOOLTIP = "New review — Quick review, Guided intake, or full wizard (Alt+N)";

export function resolveNewReviewWizardBreadcrumbLabel(): string {
  if (isBuyerVocabularyPassActive()) {
    return BUYER_NEW_REVIEW_NAV_LABEL;
  }

  return "New request";
}

/** Sidebar / pilot nav tooltip for `/reviews/new` — outcome-first, not mechanism-first (TB-646). */
export function resolveNewReviewPrimaryNavTitle(): string {
  return "Start a review — brief, evidence, or optional cloud context (Alt+N)";
}
/** Matches `/reviews` list routes (with optional query), not `/reviews/new` or `/reviews/{id}`. */
export function isReviewsListNavHref(href: string): boolean {
  const path = href.split("?")[0] ?? href;

  return path === "/reviews";
}

export function resolveReviewsListNavLinkLabel(isGovernanceModeEnabled: boolean): string {
  return governanceModeVocabulary(isGovernanceModeEnabled).reviewPlural;
}

export function resolveNewReviewNavLinkLabel(buyerPolishedShell: boolean): string {
  if (buyerPolishedShell || isBuyerVocabularyPassActive()) {
    return BUYER_NEW_REVIEW_NAV_LABEL;
  }

  return OPERATOR_NAV_LINK_LABELS.capture;
}

export function resolveNewReviewNavLinkTitle(_buyerPolishedShell: boolean): string {
  return NEW_REVIEW_NAV_TOOLTIP;
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
  isGovernanceModeEnabled = false,
): NavLinkPresentationSource {
  const vocabularyPassActive = isBuyerVocabularyPassActive();

  if (link.href === "/reviews/new" && (buyerPolishedShell || vocabularyPassActive)) {
    return applyBuyerNavVocabulary({
      href: link.href,
      label: resolveNewReviewNavLinkLabel(buyerPolishedShell || vocabularyPassActive),
      title: resolveNewReviewNavLinkTitle(buyerPolishedShell || vocabularyPassActive),
    });
  }

  if (isReviewsListNavHref(link.href)) {
    return applyBuyerNavVocabulary({
      href: link.href,
      label: resolveReviewsListNavLinkLabel(isGovernanceModeEnabled),
      title: link.title,
    });
  }

  return applyBuyerNavVocabulary(link);
}

/** Quick actions and hero CTAs use Start review; left nav uses New review. */
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
