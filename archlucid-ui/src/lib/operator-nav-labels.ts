import { CREATE_ARCHITECTURE_LABEL } from "@/lib/architecture-workflow-labels";
import { applyBuyerDemoVocabulary } from "@/lib/buyer-demo-vocabulary";
import { isBuyerVocabularyPassActive } from "@/lib/demo-ui-env";
import { governanceModeVocabulary } from "@/lib/governance-mode-vocabulary";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";

/** Buyer-polished shell left-nav label for `/reviews/new`. */
export const BUYER_NEW_REVIEW_NAV_LABEL = CREATE_ARCHITECTURE_LABEL;

/** Quick actions, hero CTAs, and empty states that open `/reviews/new`. */
export const OPERATOR_START_REVIEW_QUICK_ACTION_LABEL = CREATE_ARCHITECTURE_LABEL;

/** Default left-nav label for `/reviews/new` when buyer vocabulary pass is active (TB-646). */
export const NEW_REVIEW_NAV_LINK_LABEL = BUYER_NEW_REVIEW_NAV_LABEL;

const NEW_REVIEW_NAV_TOOLTIP = `${CREATE_ARCHITECTURE_LABEL} — Quick review, Guided intake, or full wizard (Alt+N)`;

export function resolveNewReviewWizardBreadcrumbLabel(): string {
  if (isBuyerVocabularyPassActive()) {
    return BUYER_NEW_REVIEW_NAV_LABEL;
  }

  return CREATE_ARCHITECTURE_LABEL;
}

/** Sidebar / pilot nav tooltip for `/reviews/new` — creation-first, not mechanism-first. */
export function resolveNewReviewPrimaryNavTitle(): string {
  return `${CREATE_ARCHITECTURE_LABEL} — brief, diagram, document, or optional cloud context (Alt+N)`;
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

export function resolveNewReviewNavLinkTitle(): string {
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
      title: resolveNewReviewNavLinkTitle(),
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

/** Quick actions and hero CTAs share the creation label with left nav. */
export function resolveQuickActionNavLinkPresentation(
  link: NavLinkPresentationSource,
): NavLinkPresentationSource {
  if (link.href === "/reviews/new") {
    return applyBuyerNavVocabulary({
      href: link.href,
      label: OPERATOR_START_REVIEW_QUICK_ACTION_LABEL,
      title: NEW_REVIEW_NAV_TOOLTIP,
    });
  }

  return applyBuyerNavVocabulary(link);
}
