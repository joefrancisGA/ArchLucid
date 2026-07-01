import {
  GitBranch,
  GitCompare,
  GitGraph,
  Lightbulb,
  MessageSquare,
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
          tier: "advanced",
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
          title: "Change simulation — preview expected impact of proposed architecture changes",
          icon: GitBranch,
          tier: "advanced",
          requiredAuthority: "ExecuteAuthority",
        },
        {
          href: "/advisory",
          label: OPERATOR_NAV_LINK_LABELS.architectureAdvisory,
          title: "Architecture advisory recommendations and improvement plans",
          icon: Lightbulb,
          tier: "advanced",
          requiredAuthority: "ReadAuthority",
        },
      ],
    };
  }
}
