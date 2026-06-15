import { describe, expect, it } from "vitest";

import {
  BUYER_NEW_REVIEW_NAV_LABEL,
  OPERATOR_START_REVIEW_QUICK_ACTION_LABEL,
  resolveNavLinkPresentation,
  resolveNewReviewNavLinkLabel,
  resolveQuickActionNavLinkPresentation,
} from "@/lib/operator-nav-labels";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";

describe("operator-nav-labels", () => {
  it("returns New review in buyer-polished shell", () => {
    expect(resolveNewReviewNavLinkLabel(true)).toBe(BUYER_NEW_REVIEW_NAV_LABEL);
    expect(resolveNewReviewNavLinkLabel(false)).toBe(OPERATOR_START_REVIEW_QUICK_ACTION_LABEL);
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
});
