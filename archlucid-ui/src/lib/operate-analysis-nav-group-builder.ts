import {
  GitCompare,
  GitGraph,
  Lightbulb,
  MessageSquare,
  RefreshCw,
  Search,
} from "lucide-react";

import type { NavGroupConfig } from "@/lib/nav-config.types";
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
      ],
    };
  }
}
