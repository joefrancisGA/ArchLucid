import {
  Brain,
  Compass,
  Home,
  Layers,
  LayoutDashboard,
  ListOrdered,
  Newspaper,
} from "lucide-react";

import type { NavGroupConfig } from "@/lib/nav-config.types";
import { ARCHITECTURE_INTELLIGENCE_PATH } from "@/lib/architecture/architecture-intelligence-route";
import { BUYER_ONBOARDING_NAV_TOOLTIP } from "@/lib/buyer/buyer-polish-copy";
import { ARCHITECTURES_LIST_PATH, REVIEWS_LIST_NAV_HREF } from "@/lib/architecture/architecture-routes";
import { DIGESTS_HUB_PATH } from "@/lib/digests-route-paths";
import { SPONSOR_DASHBOARD_HREF } from "@/lib/sponsor/sponsor-dashboard-route";
import { FIRST_REVIEW_GUIDE_PATH } from "@/lib/first-review-guide-route";
import { OPERATOR_NAV_GROUP_LABELS, OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import { NavGroupBuilderBase } from "@/lib/nav-group-builder-base";
import { resolveArchitecturesListNavTitle } from "@/lib/operator/operator-nav-labels";

const PORTFOLIO_OVERVIEW_NAV_TITLE = "Track ROI, risks, and governance posture";

/** Pilot layer — default authenticated path; essentials omit `requiredAuthority` where invariant requires it. */
export class PilotNavGroupBuilder extends NavGroupBuilderBase {
  build(): NavGroupConfig {
    return {
      id: "pilot",
      label: OPERATOR_NAV_GROUP_LABELS.reviewWork,
      surface: "review-workflow",
      caption:
        "Buyer-first path: Home → Architectures → Reviews → Sponsor dashboard; then First review guide and governance follow-up.",
      links: [
        {
          href: "/",
          label: OPERATOR_NAV_LINK_LABELS.home,
          // "Workspace overview" is the buyer title of `/governance/dashboard` — keep this tooltip distinct.
          title: "Workspace home",
          icon: Home,
          tier: "essential",
        },
        {
          href: ARCHITECTURES_LIST_PATH,
          label: OPERATOR_NAV_LINK_LABELS.architectures,
          title: resolveArchitecturesListNavTitle(),
          icon: Layers,
          tier: "essential",
        },
        {
          // String literal required: scripts/ci/assert_route_tier_policy_nav.py parses href:"..." only.
          href: REVIEWS_LIST_NAV_HREF as typeof REVIEWS_LIST_NAV_HREF & "/architecture/reviews",
          label: OPERATOR_NAV_LINK_LABELS.reviewPackage,
          title: this.shortcutTitle("Browse architecture reviews", "alt+r"),
          keyShortcut: "alt+r",
          icon: ListOrdered,
          tier: "essential",
        },
        {
          // String literals required: scripts/ci/assert_route_tier_policy_nav.py parses href:"..." only.
          href: SPONSOR_DASHBOARD_HREF as typeof SPONSOR_DASHBOARD_HREF & "/architecture/sponsor-dashboard",
          label: OPERATOR_NAV_LINK_LABELS.portfolioOverview,
          title: PORTFOLIO_OVERVIEW_NAV_TITLE,
          icon: LayoutDashboard,
          tier: "essential",
        },
        {
          href: FIRST_REVIEW_GUIDE_PATH as typeof FIRST_REVIEW_GUIDE_PATH & "/architecture/first-review-guide",
          label: OPERATOR_NAV_LINK_LABELS.onboarding,
          title: BUYER_ONBOARDING_NAV_TOOLTIP,
          // Catalog tier is essential; demoted to extended and moved last after first commit in nav-committed-architecture-review-promotion.ts (TB-524).
          tier: "essential",
          icon: Compass,
        },
        {
          href: DIGESTS_HUB_PATH as typeof DIGESTS_HUB_PATH & "/architecture/digests",
          label: OPERATOR_NAV_LINK_LABELS.digests,
          title: "Digests — generated digests, subscriptions, and sponsor schedule",
          icon: Newspaper,
          tier: "advanced",
          requiredAuthority: "ReadAuthority",
        },
        {
          href: ARCHITECTURE_INTELLIGENCE_PATH as typeof ARCHITECTURE_INTELLIGENCE_PATH & "/architecture/architecture-intelligence",
          label: "Architecture intelligence",
          title: "Architecture intelligence — closed-loop reasoning and golden regression checks",
          icon: Brain,
          tier: "advanced",
          requiredAuthority: "ExecuteAuthority",
        },
      ],
    };
  }
}
