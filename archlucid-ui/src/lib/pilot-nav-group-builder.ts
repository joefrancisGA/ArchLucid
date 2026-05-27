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
import { OPERATOR_NAV_GROUP_LABELS, OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";

import { NavGroupBuilderBase } from "@/lib/nav-group-builder-base";

/** Pilot layer — default authenticated path; essentials omit `requiredAuthority` where invariant requires it. */
export class PilotNavGroupBuilder extends NavGroupBuilderBase {
  build(): NavGroupConfig {
    return {
      id: "pilot",
      label: OPERATOR_NAV_GROUP_LABELS.reviewWork,
      surface: "review-workflow",
      caption:
        "Buyer-first path: Executive summary → Review package → Evidence trail → Capture for net-new input; then onboarding, findings, help, and scorecard.",
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
          href: "/dashboard",
          label: OPERATOR_NAV_LINK_LABELS.executiveSummary,
          title:
            "Executive summary — sponsor-facing ROI snapshot and package overview (illustrative metrics until API lands)",
          icon: LayoutDashboard,
          tier: "essential",
          defaultVisibleInCollapsedSidebar: true,
        },
        {
          href: "/reviews?projectId=default",
          label: OPERATOR_NAV_LINK_LABELS.reviewPackage,
          title: this.shortcutTitle(
            "Review package — open review detail, architecture package, artifacts, exports",
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
            "Capture — start a new architecture review (guided wizard through pipeline tracking)",
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
          defaultVisibleInCollapsedSidebar: true,
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
          href: "/help",
          label: OPERATOR_NAV_LINK_LABELS.help,
          title: "Help — using ArchLucid and reference documentation",
          icon: LifeBuoy,
          tier: "essential",
          defaultVisibleInCollapsedSidebar: true,
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
