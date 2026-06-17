import {
  AlertCircle,
  BarChart3,
  ClipboardList,
  GitGraph,
  Home,
  LayoutDashboard,
  LifeBuoy,
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
        "Buyer-first path: Portfolio overview → Review packages → Evidence trail → Start review for net-new input; then onboarding, findings, help, and scorecard.",
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
          href: isCtoDemoPresenterSafeModeEnv() ? getShowcaseExecutiveHref() : "/dashboard",
          label: OPERATOR_NAV_LINK_LABELS.portfolioOverview,
          title: PORTFOLIO_OVERVIEW_NAV_TITLE,
          icon: LayoutDashboard,
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
          href: "/onboarding",
          label: OPERATOR_NAV_LINK_LABELS.onboarding,
          title: "Onboarding — checklist and milestones",
          tier: "essential",
          icon: ClipboardList,
        },
        {
          href: "/governance/findings",
          label: OPERATOR_NAV_LINK_LABELS.findings,
          title: this.shortcutTitle(
            "Findings — open risks from completed reviews, severity and recommended actions",
            "alt+f",
          ),
          keyShortcut: "alt+f",
          icon: AlertCircle,
          // extended so ReadAuthority does not break Pilot-essential invariant
          // (nav-config.structure.test.ts §"keeps requiredAuthority unset on Pilot essential-tier links").
          tier: "extended",
          requiredAuthority: "ReadAuthority",
        },
        {
          href: "/governance/risk-exceptions",
          label: OPERATOR_NAV_LINK_LABELS.riskExceptions,
          title: "Risk exceptions — active waivers, renewals, and revocations",
          icon: AlertCircle,
          tier: "extended",
          requiredAuthority: "ReadAuthority",
        },
        {
          href: "/help",
          label: OPERATOR_NAV_LINK_LABELS.help,
          title: "Help — using ArchLucid and reference documentation",
          icon: LifeBuoy,
          tier: "essential",
        },
        {
          href: "/scorecard",
          label: OPERATOR_NAV_LINK_LABELS.scorecard,
          title: "Pilot scorecard — finalized-review metrics and ROI baselines",
          icon: BarChart3,
          tier: "extended",
          requiredAuthority: "ReadAuthority",
        },
      ],
    };
  }
}
