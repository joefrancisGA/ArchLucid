import { describe, expect, it } from "vitest";

import { ARCHITECTURE_DRAFTS_LIST_LABEL, CREATE_ARCHITECTURE_LABEL, START_REVIEW_LABEL } from "@/lib/architecture/architecture-workflow-labels";
import { ARCHITECTURE_IDENTITY_LIST_PAGE_TITLE } from "@/lib/architecture/architecture-identity-desk-copy";
import { ARCHITECTURES_LIST_PATH, ARCHITECTURES_NEW_PATH } from "@/lib/architecture/architecture-routes";
import {
  BUYER_NEW_REVIEW_NAV_LABEL,
  OPERATOR_START_REVIEW_QUICK_ACTION_LABEL,
  isReviewsListNavHref,
  resolveNavLinkPresentation,
  resolveNewReviewNavLinkLabel,
  resolveQuickActionNavLinkPresentation,
  resolveReviewsListNavLinkLabel,
} from "@/lib/operator/operator-nav-labels";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";

describe("operator-nav-labels", () => {
  it("returns Start review for left nav in buyer-polished and default shells", () => {
    expect(resolveNewReviewNavLinkLabel(true)).toBe(BUYER_NEW_REVIEW_NAV_LABEL);
    expect(resolveNewReviewNavLinkLabel(false)).toBe(BUYER_NEW_REVIEW_NAV_LABEL);
    expect(BUYER_NEW_REVIEW_NAV_LABEL).toBe(START_REVIEW_LABEL);
  });

  it("overrides /architectures list presentation for buyer shells", () => {
    const source = {
      href: ARCHITECTURES_LIST_PATH,
      label: "Drafts",
      title: "Architecture drafts",
    };

    expect(resolveNavLinkPresentation(source, true).label).toBe(ARCHITECTURE_DRAFTS_LIST_LABEL);
    expect(resolveNavLinkPresentation(source, false).label).toBe(ARCHITECTURE_DRAFTS_LIST_LABEL);
  });

  it("CA-32: Working sidebar Architectures means identity portfolio", () => {
    const source = {
      href: ARCHITECTURES_LIST_PATH,
      label: "Draft inventory",
      title: "Draft inventory",
    };

    const working = resolveNavLinkPresentation(source, false, false, true);

    expect(working.label).toBe(ARCHITECTURE_IDENTITY_LIST_PAGE_TITLE);
    expect(working.title).toContain("Durable architecture identities");
  });

  it("CA-36: Guided sidebar keeps draft-inventory teaching tooltip", () => {
    const source = {
      href: ARCHITECTURES_LIST_PATH,
      label: "Draft inventory",
      title: "Draft inventory",
    };

    const guided = resolveNavLinkPresentation(source, false, false, false);

    expect(guided.label).toBe(ARCHITECTURE_DRAFTS_LIST_LABEL);
    expect(guided.title).toContain("saved architecture drafts");
  });

  it("overrides /architectures/new presentation when buyer vocabulary pass is active", () => {
    const source = {
      href: ARCHITECTURES_NEW_PATH,
      label: "Capture",
      title: "Create architecture — start",
    };

    expect(resolveNavLinkPresentation(source, true).label).toBe(CREATE_ARCHITECTURE_LABEL);
    expect(resolveNavLinkPresentation(source, false).label).toBe(CREATE_ARCHITECTURE_LABEL);
  });

  it("overrides /architecture/reviews/new presentation when buyer vocabulary pass is active", () => {
    const source = {
      href: "/architecture/reviews/new",
      label: OPERATOR_NAV_LINK_LABELS.capture,
      title: "Create architecture — start",
    };

    expect(resolveNavLinkPresentation(source, true).label).toBe(BUYER_NEW_REVIEW_NAV_LABEL);
    expect(resolveNavLinkPresentation(source, false).label).toBe(BUYER_NEW_REVIEW_NAV_LABEL);
  });

  it("labels quick action /architecture/reviews/new as Start review", () => {
    const source = {
      href: "/architecture/reviews/new",
      label: OPERATOR_NAV_LINK_LABELS.capture,
      title: "Start review — begin",
    };

    expect(resolveQuickActionNavLinkPresentation(source).label).toBe(OPERATOR_START_REVIEW_QUICK_ACTION_LABEL);
    expect(OPERATOR_START_REVIEW_QUICK_ACTION_LABEL).toBe(START_REVIEW_LABEL);
  });

  it("TB-606: matches reviews list hrefs only", () => {
    expect(isReviewsListNavHref("/architecture/reviews")).toBe(true);
    expect(isReviewsListNavHref("/architecture/reviews")).toBe(true);
    expect(isReviewsListNavHref("/architecture/reviews/new")).toBe(false);
    expect(isReviewsListNavHref("/architecture/reviews/run-123")).toBe(false);
  });

  it("TB-606: aligns reviews-list sidebar labels with governance-mode vocabulary", () => {
    expect(resolveReviewsListNavLinkLabel(false)).toBe("Reviews");
    expect(resolveReviewsListNavLinkLabel(true)).toBe("Reviews");

    const source = {
      href: "/architecture/reviews",
      label: OPERATOR_NAV_LINK_LABELS.reviewPackage,
      title: "Browse architecture reviews",
    };

    expect(resolveNavLinkPresentation(source, false, false).label).toBe("Reviews");
    expect(resolveNavLinkPresentation(source, false, true).label).toBe("Reviews");
  });

  it("TB-882: curated operator surfaces keep sidebar labels aligned with route titles", () => {
    expect(resolveNavLinkPresentation(
      {
        href: "/internal/trial-funnel",
        label: "Trial funnel",
        title: "Trial funnel — trial activation, review completion, conversion, and estimated first-review AI cost",
      },
      true,
    ).label).toBe("Trial funnel");
  });
});
