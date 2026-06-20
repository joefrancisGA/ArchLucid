import {
  ClipboardList,
  GitGraph,
  Home,
  LayoutDashboard,
  ListOrdered,
  Rocket,
} from "lucide-react";

import type { NavGroupConfig } from "@/lib/nav-config.types";
import { getShowcaseExecutiveHref } from "@/lib/buyer-safe-review-navigation";
import { isCtoDemoPresenterSafeModeEnv } from "@/lib/cto-demo-presenter-pack";
import { OPERATOR_NAV_GROUP_LABELS, OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";

import { NavGroupBuilderBase } from "@/lib/nav-group-builder-base";

const PORTFOLIO_OVERVIEW_NAV_TITLE =
  "Portfolio overview — sponsor-facing ROI snapshot and package overview";

/** Pilot layer — default authenticated path; essentials omit `requiredAuthority` where invariant requires it. */
export class PilotNavGroupBuilder extends NavGroupBuilderBase {
  build(): NavGroupConfig {
    return {
      id: "pilot",
      label: OPERATOR_NAV_GROUP_LABELS.reviewWork,
      surface: "review-workflow",
      caption:
        "Buyer-first path: Home → Start review → Evidence trail → Review packages → Portfolio overview; then onboarding and governance follow-up.",
      links: [
        {
          href: "/",
          label: OPERATOR_NAV_LINK_LABELS.home,
          title: this.shortcutTitle("Home — V1 checklist and quick links", "alt+h"),
          keyShortcut: "alt+h",
          icon: Home,
          tier: "essential",
          defaultVisibleInCollapsedSidebar: true,
        },
        {
          href: "/reviews/new",
          label: OPERATOR_NAV_LINK_LABELS.capture,
          title: this.shortcutTitle(
            "Start review — Quick review, Guided intake, or full wizard",
            "alt+n",
          ),
          keyShortcut: "alt+n",
          icon: Rocket,
          tier: "essential",
          defaultVisibleInCollapsedSidebar: true,
        },
        {
          href: "/graph",
          label: OPERATOR_NAV_LINK_LABELS.evidenceTrail,
          title: this.shortcutTitle(
            `${OPERATOR_NAV_LINK_LABELS.evidenceTrail} — decision traceability graph for one review`,
            "alt+y",
          ),
          keyShortcut: "alt+y",
          icon: GitGraph,
          tier: "essential",
          defaultVisibleInCollapsedSidebar: true,
        },
        {
          href: "/reviews?projectId=default",
          label: OPERATOR_NAV_LINK_LABELS.reviewPackage,
          title: this.shortcutTitle(
            "Review packages — open review detail, architecture package, artifacts, exports",
            "alt+r",
          ),
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
          title: "Onboarding — checklist and milestones",
          tier: "essential",
          icon: ClipboardList,
          defaultVisibleInCollapsedSidebar: true,
        },
      ],
    };
  }
}
