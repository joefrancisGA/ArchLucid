import {
  GitCompare,
  GitGraph,
  Kanban,
  Lightbulb,
  MessageSquare,
  MessageSquareText,
  RefreshCw,
  Search,
  Sparkles,
} from "lucide-react";

import type { NavGroupConfig } from "@/lib/nav-config.types";
import { BUYER_TERMINOLOGY } from "@/lib/buyer-surface-vocabulary";
import { OPERATOR_NAV_GROUP_LABELS, OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";

import { NavGroupBuilderBase } from "@/lib/nav-group-builder-base";

/** Operate · analysis — Q&A, search, and comparison over review evidence. */
export class OperateAnalysisNavGroupBuilder extends NavGroupBuilderBase {
  build(): NavGroupConfig {
    return {
      id: "operate-analysis",
      label: OPERATOR_NAV_GROUP_LABELS.analysis,
      surface: "review-workflow",
      caption: "Explore evidence, findings, and decisions across reviews.",
      links: [
        {
          href: "/graph",
          label: OPERATOR_NAV_LINK_LABELS.evidenceTrail,
          title: this.shortcutTitle("Trace evidence, findings, and decisions", "alt+y"),
          keyShortcut: "alt+y",
          icon: GitGraph,
          tier: "essential",
          requiredAuthority: "ReadAuthority",
        },
        {
          href: "/ask",
          label: OPERATOR_NAV_LINK_LABELS.askReview,
          title: this.shortcutTitle("Ask questions about a review package", "alt+a"),
          keyShortcut: "alt+a",
          icon: MessageSquare,
          tier: "essential",
          requiredAuthority: "ReadAuthority",
        },
        {
          href: "/search",
          label: OPERATOR_NAV_LINK_LABELS.searchEvidence,
          title: "Find evidence, findings, and decisions",
          icon: Search,
          tier: "essential",
          requiredAuthority: "ReadAuthority",
        },
        {
          href: "/compare",
          label: OPERATOR_NAV_LINK_LABELS.compareTwoReviews,
          title: this.shortcutTitle("See what changed between reviews", "alt+c"),
          keyShortcut: "alt+c",
          icon: GitCompare,
          tier: "extended",
          requiredAuthority: "ReadAuthority",
        },
        {
          href: "/evolution-review",
          label: OPERATOR_NAV_LINK_LABELS.evolutionCandidates,
          title: "Impact preview — preview expected impact of proposed architecture changes on governance posture",
          icon: RefreshCw,
          tier: "advanced",
          // Browsing existing proposed changes and their previews only needs ReadAuthority — matches the
          // EvolutionController list/detail/results/export endpoints. Only "Simulate change impact" itself is
          // Execute-gated (see useOperateCapability() in EvolutionReviewPageView and the /simulate endpoint policy).
          requiredAuthority: "ReadAuthority",
        },
        {
          href: "/advisory",
          label: OPERATOR_NAV_LINK_LABELS.architectureAdvisory,
          title: "Scheduled advisory scans and improvement recommendations",
          icon: Lightbulb,
          tier: "advanced",
          requiredAuthority: "ReadAuthority",
        },
        {
          href: "/recommendation-learning",
          label: OPERATOR_NAV_LINK_LABELS.recommendationTuning,
          title: "Recommendation tuning — profiles and ranking signals",
          icon: Sparkles,
          tier: "advanced",
          // Profile GET is ReadAuthority and matches this nav gate; only the "Rebuild tuning profile" action is
          // ExecuteAuthority — gated client-side via useOperateCapability() in RecommendationLearningPageClient.
          requiredAuthority: "ReadAuthority",
        },
        {
          href: "/product-learning",
          label: OPERATOR_NAV_LINK_LABELS.pilotFeedback,
          title: `${BUYER_TERMINOLOGY.evaluationFeedback} — recurring issues and improvement opportunities`,
          icon: MessageSquareText,
          tier: "advanced",
          requiredAuthority: "ReadAuthority",
        },
        {
          href: "/planning",
          label: OPERATOR_NAV_LINK_LABELS.planning,
          title: "Planning — improvement themes and prioritized plans",
          icon: Kanban,
          tier: "advanced",
          // Browsing themes/plans (list, detail) only needs ReadAuthority — matches LearningController's class-level
          // [Authorize(ReadAuthority)] default. The page has no mutation controls; "Create draft plans" lives on the
          // Pilot feedback page and is Execute-gated there.
          requiredAuthority: "ReadAuthority",
        },
      ],
    };
  }
}
