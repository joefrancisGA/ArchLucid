import {
  Compass,
  FileText,
  Home,
  LayoutDashboard,
  ListOrdered,
  Newspaper,
  PenLine,
} from "lucide-react";

import type { NavGroupConfig } from "@/lib/nav-config.types";
import { ARCHITECTURES_LIST_PATH } from "@/lib/architecture/architecture-routes";
import { ARCHITECTURE_DRAFTS_LIST_LABEL } from "@/lib/architecture/architecture-workflow-labels";
import { BUYER_ONBOARDING_NAV_TOOLTIP } from "@/lib/buyer/buyer-polish-copy";
import { DIGESTS_HUB_PATH } from "@/lib/digests-route-paths";
import { SPONSOR_DASHBOARD_HREF } from "@/lib/sponsor/sponsor-dashboard-route";
import { FIRST_REVIEW_GUIDE_PATH } from "@/lib/first-review-guide-route";
import { OPERATOR_NAV_GROUP_LABELS, OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import { resolveArchitecturesListNavTitle } from "@/lib/operator/operator-nav-labels";
import { NavGroupBuilderBase } from "@/lib/nav-group-builder-base";
import {
  FIRST_RUN_GUIDE_NAV_LABEL,
  FIRST_RUN_GUIDE_NAV_PATH,
  PACKAGES_NAV_HREF,
  PACKAGES_NAV_LABEL,
} from "@/lib/usability/usability-consolidation";
import { SIGNED_RECORDS_LIST_PATH } from "@/lib/signed-records-paths";

const PORTFOLIO_OVERVIEW_NAV_TITLE = "Track ROI, risks, and approval status";

/** Pilot layer — default authenticated path; essentials omit `requiredAuthority` where invariant requires it. */
export class PilotNavGroupBuilder extends NavGroupBuilderBase {
  build(): NavGroupConfig {
    return {
      id: "pilot",
      label: OPERATOR_NAV_GROUP_LABELS.reviewWork,
      surface: "review-workflow",
      caption:
        "Buyer-first path: Home → Packages → Sponsor dashboard; then Getting started and approval follow-up.",
      links: [
        {
          href: "/",
          label: OPERATOR_NAV_LINK_LABELS.home,
          // `/governance/dashboard` is "Workspace health" — keep this tooltip distinct from it.
          title: "Workspace home",
          icon: Home,
          tier: "essential",
        },
        {
          // String literal required: scripts/ci/assert_route_tier_policy_nav.py parses href:"..." only.
          href: ARCHITECTURES_LIST_PATH as typeof ARCHITECTURES_LIST_PATH & "/architecture/architectures",
          label: ARCHITECTURE_DRAFTS_LIST_LABEL,
          title: resolveArchitecturesListNavTitle(),
          icon: PenLine,
          tier: "essential",
        },
        {
          // String literal required: scripts/ci/assert_route_tier_policy_nav.py parses href:"..." only.
          href: PACKAGES_NAV_HREF as typeof PACKAGES_NAV_HREF & "/architecture/reviews",
          label: PACKAGES_NAV_LABEL,
          title: this.shortcutTitle("Browse reviews and drafts", "alt+r"),
          keyShortcut: "alt+r",
          icon: ListOrdered,
          tier: "essential",
        },
        {
          href: SIGNED_RECORDS_LIST_PATH,
          label: OPERATOR_NAV_LINK_LABELS.sealedReviewRecords,
          title: "Browse finalized review records across reviews",
          icon: FileText,
          tier: "essential",
          requiredAuthority: "ReadAuthority",
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
          href: FIRST_RUN_GUIDE_NAV_PATH as typeof FIRST_REVIEW_GUIDE_PATH & "/architecture/first-review-guide",
          label: FIRST_RUN_GUIDE_NAV_LABEL,
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
        // TB-2241: contextual-only paths live in nav-contextual-only-operator-paths.ts (not pilot nav).
      ],
    };
  }
}
