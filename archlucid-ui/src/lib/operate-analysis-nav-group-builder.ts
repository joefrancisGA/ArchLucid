import {
  BarChart3,
  GitCompare,
  GitGraph,
  Layers,
  MessageSquare,
  RefreshCw,
  Search,
} from "lucide-react";

import type { NavGroupConfig } from "@/lib/nav-config.types";
import { BUYER_TERMINOLOGY } from "@/lib/buyer-surface-vocabulary";
import { PATTERN_LIBRARY_NAV_BADGE, PATTERN_LIBRARY_NAV_LINK_LABEL } from "@/lib/pattern-library-copy";
import { PATTERN_LIBRARY_PATH } from "@/lib/pattern-library-route";
import { OPERATOR_NAV_GROUP_LABELS, OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";

import { ARCHITECTURE_SCORECARD_PATH } from "@/lib/architecture-scorecard-route";
import { ASK_REVIEW_QUESTIONS_PATH } from "@/lib/ask-review-questions-route";
import { COMPARE_TWO_REVIEWS_PATH } from "@/lib/compare-two-reviews-route";
import { EVIDENCE_GRAPH_PATH } from "@/lib/evidence-graph-route";
import { IMPACT_PREVIEW_PATH } from "@/lib/impact-preview-route";
import { SEARCH_REVIEW_EVIDENCE_PATH } from "@/lib/search-review-evidence-route";
import { NavGroupBuilderBase } from "@/lib/nav-group-builder-base";

/** Operate · analysis — Q&A, search, and comparison over review evidence. */
export class OperateAnalysisNavGroupBuilder extends NavGroupBuilderBase {
  build(): NavGroupConfig {
    const links: NavGroupConfig["links"] = [
      {
        // String literals required: scripts/ci/assert_route_tier_policy_nav.py parses href:"..." only.
        href: EVIDENCE_GRAPH_PATH as typeof EVIDENCE_GRAPH_PATH & "/insights/evidence-graph",
        label: OPERATOR_NAV_LINK_LABELS.evidenceTrail,
        title: this.shortcutTitle("Trace evidence, findings, and decisions", "alt+y"),
        keyShortcut: "alt+y",
        icon: GitGraph,
        tier: "essential",
        requiredAuthority: "ReadAuthority",
      },
      {
        href: ASK_REVIEW_QUESTIONS_PATH as typeof ASK_REVIEW_QUESTIONS_PATH & "/insights/ask-review-questions",
        label: OPERATOR_NAV_LINK_LABELS.askReview,
        title: this.shortcutTitle("Ask questions about a review", "alt+a"),
        keyShortcut: "alt+a",
        icon: MessageSquare,
        tier: "essential",
        requiredAuthority: "ReadAuthority",
      },
      {
        href: SEARCH_REVIEW_EVIDENCE_PATH as typeof SEARCH_REVIEW_EVIDENCE_PATH & "/insights/search-review-evidence",
        label: OPERATOR_NAV_LINK_LABELS.searchEvidence,
        title: "Find evidence, findings, and decisions",
        icon: Search,
        tier: "essential",
        requiredAuthority: "ReadAuthority",
      },
      {
        href: COMPARE_TWO_REVIEWS_PATH as typeof COMPARE_TWO_REVIEWS_PATH & "/insights/compare-two-reviews",
        label: OPERATOR_NAV_LINK_LABELS.compareTwoReviews,
        title: this.shortcutTitle("See what changed between reviews", "alt+c"),
        keyShortcut: "alt+c",
        icon: GitCompare,
        tier: "extended",
        requiredAuthority: "ReadAuthority",
      },
      {
        href: IMPACT_PREVIEW_PATH as typeof IMPACT_PREVIEW_PATH & "/insights/impact-preview",
        label: OPERATOR_NAV_LINK_LABELS.evolutionCandidates,
        title: "Impact preview — estimate before-and-after effects of proposed architecture changes",
        icon: RefreshCw,
        tier: "extended",
        requiredAuthority: "ReadAuthority",
      },
      {
        href: ARCHITECTURE_SCORECARD_PATH as typeof ARCHITECTURE_SCORECARD_PATH & "/insights/architecture-scorecard",
        label: OPERATOR_NAV_LINK_LABELS.scorecard,
        title: `${BUYER_TERMINOLOGY.reviewScorecard} — finalized package metrics and ROI baselines`,
        icon: BarChart3,
        tier: "extended",
        requiredAuthority: "ReadAuthority",
      },
      {
        // String literals required: scripts/ci/assert_route_tier_policy_nav.py parses href:"..." only.
        href: "/insights/patterns" as typeof PATTERN_LIBRARY_PATH,
        label: PATTERN_LIBRARY_NAV_LINK_LABEL,
        title: "Explore anonymized architecture patterns and adoption signals",
        icon: Layers,
        tier: "extended",
        requiredAuthority: "ReadAuthority",
        navBadge: PATTERN_LIBRARY_NAV_BADGE,
      },
    ];

    return {
      id: "operate-analysis",
      label: OPERATOR_NAV_GROUP_LABELS.analysis,
      surface: "review-workflow",
      caption: "Explore evidence, findings, and decisions across reviews.",
      links,
    };
  }
}
