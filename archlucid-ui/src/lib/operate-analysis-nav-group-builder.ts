import {
  BarChart3,
  FileText,
  GitCompare,
  GitGraph,
  Kanban,
  Layers,
  MessageSquare,
  RefreshCw,
  Search,
  TrendingUp,
} from "lucide-react";

import type { NavGroupConfig } from "@/lib/nav-config.types";
import { BUYER_TERMINOLOGY } from "@/lib/vocabulary/buyer-surface-vocabulary";
import { PATTERN_LIBRARY_NAV_LINK_LABEL } from "@/lib/pattern-library-copy";
import { PATTERN_LIBRARY_PATH } from "@/lib/pattern-library-route";
import { OPERATOR_NAV_GROUP_LABELS, OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";

import { ARCHITECTURE_SCORECARD_PATH } from "@/lib/architecture/architecture-scorecard-route";
import { ASK_REVIEW_QUESTIONS_PATH } from "@/lib/ask-review-questions-route";
import { COMPARE_TWO_REVIEWS_PATH } from "@/lib/compare-two-reviews-route";
import { EVIDENCE_GRAPH_PATH } from "@/lib/evidence-graph-route";
import { IMPACT_PREVIEW_PATH } from "@/lib/impact-preview-route";
import { PLANNING_PATH } from "@/lib/planning-route";
import { SEARCH_REVIEW_EVIDENCE_PATH } from "@/lib/search-review-evidence-route";
import {
  SPONSOR_REPORT_PATH,
  SPONSOR_REPORT_PAGE_TITLE,
  SPONSOR_REPORT_ROI_SUMMARY_PATH,
  SPONSOR_REPORT_SECTION_LABEL,
} from "@/lib/sponsor-report-navigation";
import { NavGroupBuilderBase } from "@/lib/nav-group-builder-base";

/** Operate · analysis — Q&A, search, and comparison over review evidence. */
export class OperateAnalysisNavGroupBuilder extends NavGroupBuilderBase {
  build(): NavGroupConfig {
    const links: NavGroupConfig["links"] = [
      {
        // String literals required: scripts/ci/assert_route_tier_policy_nav.py parses href:"..." only.
        href: EVIDENCE_GRAPH_PATH as typeof EVIDENCE_GRAPH_PATH & "/insights/evidence-graph",
        label: OPERATOR_NAV_LINK_LABELS.evidenceGraph,
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
        // String literals required: scripts/ci/assert_route_tier_policy_nav.py parses href:"..." only.
        href: PLANNING_PATH as typeof PLANNING_PATH & "/insights/improvement-planning",
        label: OPERATOR_NAV_LINK_LABELS.planning,
        title: "Planning — improvement themes and prioritized plans",
        icon: Kanban,
        tier: "advanced",
        // Browsing themes/plans (list, detail) only needs ReadAuthority — matches LearningController's class-level
        // [Authorize(ReadAuthority)] default. The page has no mutation controls; "Create draft plans" lives on the
        // Review feedback page (Internal Operations) and is Execute-gated there.
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
      },
      {
        // String literals required: scripts/ci/assert_route_tier_policy_nav.py parses href:"..." only.
        href: SPONSOR_REPORT_PATH as typeof SPONSOR_REPORT_PATH & "/insights/sponsor-report",
        label: SPONSOR_REPORT_PAGE_TITLE,
        title: `${SPONSOR_REPORT_SECTION_LABEL} — finalized-review outcomes, approval signals, and sponsor exports`,
        icon: FileText,
        // Read-only viewing of the report; the DOCX / board-pack exports are Execute-gated in the page itself.
        tier: "extended",
        requiredAuthority: "ReadAuthority",
      },
      {
        href: SPONSOR_REPORT_ROI_SUMMARY_PATH as typeof SPONSOR_REPORT_ROI_SUMMARY_PATH & "/insights/roi-summary",
        label: OPERATOR_NAV_LINK_LABELS.roiReport,
        title: "ROI summary — hours estimate from severities and approval-check blocks",
        icon: TrendingUp,
        tier: "extended",
        requiredAuthority: "ReadAuthority",
      },
    ];

    return {
      id: "operate-analysis",
      label: OPERATOR_NAV_GROUP_LABELS.analysis,
      surface: "review-workflow",
      caption: "Explore evidence, findings, decisions, and sponsor value reports across reviews.",
      links,
    };
  }
}
