import { describe, expect, it } from "vitest";

import {
  BUYER_NEW_REVIEW_NAV_LABEL,
  OPERATOR_START_REVIEW_QUICK_ACTION_LABEL,
  isReviewsListNavHref,
  resolveNavLinkPresentation,
  resolveNewReviewNavLinkLabel,
  resolveQuickActionNavLinkPresentation,
  resolveReviewsListNavLinkLabel,
} from "@/lib/operator-nav-labels";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";

describe("operator-nav-labels", () => {
  it("returns New review for left nav in buyer-polished and default shells", () => {
    expect(resolveNewReviewNavLinkLabel(true)).toBe(BUYER_NEW_REVIEW_NAV_LABEL);
    expect(resolveNewReviewNavLinkLabel(false)).toBe(OPERATOR_NAV_LINK_LABELS.capture);
  });

  it("overrides /reviews/new presentation for buyer shell", () => {
    const source = {
      href: "/reviews/new",
      label: OPERATOR_NAV_LINK_LABELS.capture,
      title: "Start review — start",
    };

    expect(resolveNavLinkPresentation(source, true).label).toBe(BUYER_NEW_REVIEW_NAV_LABEL);
    expect(resolveNavLinkPresentation(source, false).label).toBe(OPERATOR_NAV_LINK_LABELS.capture);
  });

  it("labels quick action /reviews/new as Start review", () => {
    const source = {
      href: "/reviews/new",
      label: OPERATOR_NAV_LINK_LABELS.capture,
      title: "Start review — start",
    };

    expect(resolveQuickActionNavLinkPresentation(source).label).toBe(OPERATOR_START_REVIEW_QUICK_ACTION_LABEL);
  });

  it("TB-606: matches reviews list hrefs only", () => {
    expect(isReviewsListNavHref("/reviews?projectId=default")).toBe(true);
    expect(isReviewsListNavHref("/reviews")).toBe(true);
    expect(isReviewsListNavHref("/reviews/new")).toBe(false);
    expect(isReviewsListNavHref("/reviews/run-123")).toBe(false);
  });

  it("TB-606: aligns reviews-list sidebar labels with governance-mode vocabulary", () => {
    expect(resolveReviewsListNavLinkLabel(false)).toBe("Reviews");
    expect(resolveReviewsListNavLinkLabel(true)).toBe("Runs");

    const source = {
      href: "/reviews?projectId=default",
      label: OPERATOR_NAV_LINK_LABELS.reviewPackage,
      title: "Browse finalized review packages",
    };

    expect(resolveNavLinkPresentation(source, false, false).label).toBe("Reviews");
    expect(resolveNavLinkPresentation(source, false, true).label).toBe("Runs");
  });
});
