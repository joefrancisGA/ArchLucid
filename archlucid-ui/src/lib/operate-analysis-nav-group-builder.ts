import {
  BarChart3,
  GitCompare,
  GitGraph,
  Layers,
  MessageSquare,
  Search,
} from "lucide-react";

import type { NavGroupConfig } from "@/lib/nav-config.types";
import { BUYER_TERMINOLOGY } from "@/lib/buyer-surface-vocabulary";
import { PATTERN_LIBRARY_NAV_BADGE, PATTERN_LIBRARY_NAV_LINK_LABEL } from "@/lib/pattern-library-copy";
import { isPatternLibraryNavVisible } from "@/lib/pattern-library-provenance";
import { OPERATOR_NAV_GROUP_LABELS, OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";

import { NavGroupBuilderBase } from "@/lib/nav-group-builder-base";

/** Operate · analysis — Q&A, search, and comparison over review evidence. */
export class OperateAnalysisNavGroupBuilder extends NavGroupBuilderBase {
  build(): NavGroupConfig {
    const links: NavGroupConfig["links"] = [
      {
        href: "/graph",
        label: OPERATOR_NAV_LINK_LABELS.evidenceTrail,
        title: this.shortcutTitle("Trace evidence, findings, and decisions", "alt+y"),
        keyShortcut: "alt+y",
        icon: GitGraph,
        tier: "essential",
        requiredAuthority: "ReadAuthority",
      },
    ];

    if (isPatternLibraryNavVisible()) {
      links.push({
        href: "/patterns",
        label: PATTERN_LIBRARY_NAV_LINK_LABEL,
        title: "Explore anonymized architecture patterns and adoption signals",
        icon: Layers,
        tier: "extended",
        requiredAuthority: "ReadAuthority",
        navBadge: PATTERN_LIBRARY_NAV_BADGE,
      });
    }

    links.push(
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
        href: "/scorecard",
        label: OPERATOR_NAV_LINK_LABELS.scorecard,
        title: `${BUYER_TERMINOLOGY.reviewScorecard} — finalized-review metrics and ROI baselines`,
        icon: BarChart3,
        tier: "extended",
        requiredAuthority: "ReadAuthority",
      },
    );

    return {
      id: "operate-analysis",
      label: OPERATOR_NAV_GROUP_LABELS.analysis,
      surface: "review-workflow",
      caption: "Explore evidence, findings, and decisions across reviews.",
      links,
    };
  }
}
