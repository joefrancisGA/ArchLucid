import {
  ARCHITECTURE_DRAFTS_LIST_LABEL,
  CREATE_ARCHITECTURE_LABEL,
  START_REVIEW_LABEL,
} from "@/lib/architecture-workflow-labels";
import {
  ARCHITECTURES_LIST_PATH,
  ARCHITECTURES_NEW_PATH,
  REVIEWS_LIST_PATH,
  REVIEWS_NEW_PATH,
} from "@/lib/architecture-routes";
import { applyBuyerDemoVocabulary } from "@/lib/vocabulary/buyer-demo-vocabulary";
import { isBuyerVocabularyPassActive } from "@/lib/demo-ui-env";
import { governanceModeVocabulary } from "@/lib/vocabulary/governance-mode-vocabulary";

/** Buyer-polished shell left-nav label for `/architecture/reviews/new`. */
export const BUYER_NEW_REVIEW_NAV_LABEL = START_REVIEW_LABEL;

/** Quick actions, hero CTAs, and empty states that open `/architecture/reviews/new`. */
export const OPERATOR_START_REVIEW_QUICK_ACTION_LABEL = START_REVIEW_LABEL;

/** Default left-nav label for `/architecture/reviews/new` when buyer vocabulary pass is active (TB-646). */
export const NEW_REVIEW_NAV_LINK_LABEL = BUYER_NEW_REVIEW_NAV_LABEL;

const NEW_REVIEW_NAV_TOOLTIP = `${START_REVIEW_LABEL} — Quick review, Guided intake, or full wizard (Alt+N)`;

const CREATE_ARCHITECTURE_NAV_TOOLTIP = `${CREATE_ARCHITECTURE_LABEL} — save drafts and resume later without starting a review`;

export function resolveNewReviewWizardBreadcrumbLabel(): string {
  if (isBuyerVocabularyPassActive()) {
    return BUYER_NEW_REVIEW_NAV_LABEL;
  }

  return START_REVIEW_LABEL;
}

/** Sidebar / pilot nav tooltip for `/architecture/reviews/new` — explicit review initiation. */
export function resolveStartReviewPrimaryNavTitle(): string {
  return `${START_REVIEW_LABEL} — evaluate an existing architecture or submitted material (Alt+N)`;
}

/** Sidebar / pilot nav tooltip for `/architecture/architectures/new`. */
export function resolveCreateArchitecturePrimaryNavTitle(): string {
  return CREATE_ARCHITECTURE_NAV_TOOLTIP;
}

/** Sidebar / pilot nav tooltip for `/architecture/architectures` — architecture draft inventory. */
export function resolveArchitecturesListNavTitle(): string {
  return `${ARCHITECTURE_DRAFTS_LIST_LABEL} — saved architecture drafts; create and resume without starting a review`;
}

/** @deprecated Use {@link resolveStartReviewPrimaryNavTitle} for `/architecture/reviews/new`. */
export function resolveNewReviewPrimaryNavTitle(): string {
  return resolveStartReviewPrimaryNavTitle();
}

/** Matches `/architecture/reviews` list routes (with optional query), not `/new` or `/{id}`. */
export function isReviewsListNavHref(href: string): boolean {
  const path = href.split("?")[0] ?? href;

  return path === REVIEWS_LIST_PATH;
}

export function resolveReviewsListNavLinkLabel(isGovernanceModeEnabled: boolean): string {
  return governanceModeVocabulary(isGovernanceModeEnabled).reviewPlural;
}

export function resolveNewReviewNavLinkLabel(buyerPolishedShell: boolean): string {
  if (buyerPolishedShell || isBuyerVocabularyPassActive()) {
    return BUYER_NEW_REVIEW_NAV_LABEL;
  }

  return START_REVIEW_LABEL;
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

  if (link.href === ARCHITECTURES_LIST_PATH) {
    return applyBuyerNavVocabulary({
      href: link.href,
      label: ARCHITECTURE_DRAFTS_LIST_LABEL,
      title: resolveArchitecturesListNavTitle(),
    });
  }

  if (link.href === ARCHITECTURES_NEW_PATH && (buyerPolishedShell || vocabularyPassActive)) {
    return applyBuyerNavVocabulary({
      href: link.href,
      label: CREATE_ARCHITECTURE_LABEL,
      title: resolveCreateArchitecturePrimaryNavTitle(),
    });
  }

  if (link.href === REVIEWS_NEW_PATH && (buyerPolishedShell || vocabularyPassActive)) {
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
  if (link.href === ARCHITECTURES_NEW_PATH) {
    return applyBuyerNavVocabulary({
      href: link.href,
      label: CREATE_ARCHITECTURE_LABEL,
      title: CREATE_ARCHITECTURE_NAV_TOOLTIP,
    });
  }

  if (link.href === REVIEWS_NEW_PATH) {
    return applyBuyerNavVocabulary({
      href: link.href,
      label: OPERATOR_START_REVIEW_QUICK_ACTION_LABEL,
      title: NEW_REVIEW_NAV_TOOLTIP,
    });
  }

  return applyBuyerNavVocabulary(link);
}
