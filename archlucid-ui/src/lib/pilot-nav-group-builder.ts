import {
  Compass,
  Home,
  LayoutDashboard,
  ListOrdered,
  Rocket,
} from "lucide-react";

import type { NavGroupConfig } from "@/lib/nav-config.types";
import { BUYER_ONBOARDING_NAV_TOOLTIP } from "@/lib/buyer-polish-copy";
import { getShowcaseExecutiveHref } from "@/lib/buyer-safe-review-navigation";
import { isCtoDemoPresenterSafeModeEnv } from "@/lib/cto-demo-presenter-pack";
import { OPERATOR_NAV_GROUP_LABELS, OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import { NEW_REVIEW_NAV_LINK_LABEL, resolveNewReviewPrimaryNavTitle } from "@/lib/operator-nav-labels";
import { NavGroupBuilderBase } from "@/lib/nav-group-builder-base";

const PORTFOLIO_OVERVIEW_NAV_TITLE = "Track ROI, risks, and governance posture";

/** Pilot layer — default authenticated path; essentials omit `requiredAuthority` where invariant requires it. */
export class PilotNavGroupBuilder extends NavGroupBuilderBase {
  build(): NavGroupConfig {
    return {
      id: "pilot",
      label: OPERATOR_NAV_GROUP_LABELS.reviewWork,
      surface: "review-workflow",
      caption:
        "Buyer-first path: Overview → New review → Review packages → Executive dashboard; then First review guide and governance follow-up.",
      links: [
        {
          href: "/",
          label: OPERATOR_NAV_LINK_LABELS.home,
          title: "Workspace overview",
          icon: Home,
          tier: "essential",
          defaultVisibleInCollapsedSidebar: true,
        },
        {
          href: "/reviews/new",
          label: NEW_REVIEW_NAV_LINK_LABEL,
          title: resolveNewReviewPrimaryNavTitle(),
          keyShortcut: "alt+n",
          icon: Rocket,
          tier: "essential",
          defaultVisibleInCollapsedSidebar: true,
        },
        {
          href: "/reviews?projectId=default",
          label: OPERATOR_NAV_LINK_LABELS.reviewPackage,
          title: this.shortcutTitle("Browse finalized review packages", "alt+r"),
          keyShortcut: "alt+r",
          icon: ListOrdered,
          tier: "essential",
          defaultVisibleInCollapsedSidebar: true,
        },
        {
          href: isCtoDemoPresenterSafeModeEnv() ? getShowcaseExecutiveHref() : "/dashboard",
          label: OPERATOR_NAV_LINK_LABELS.portfolioOverview,
          title: PORTFOLIO_OVERVIEW_NAV_TITLE,
          icon: LayoutDashboard,
          tier: "essential",
          defaultVisibleInCollapsedSidebar: true,
        },
        {
          href: "/onboarding",
          label: OPERATOR_NAV_LINK_LABELS.onboarding,
          title: BUYER_ONBOARDING_NAV_TOOLTIP,
          // Catalog tier is essential; demoted to extended after first commit in nav-committed-architecture-review-promotion.ts (TB-524).
          tier: "essential",
          icon: Compass,
          defaultVisibleInCollapsedSidebar: true,
        },
      ],
    };
  }
}
