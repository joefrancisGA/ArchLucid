import {
  AlertCircle,
  GitCompare,
  MessageSquare,
  Play,
  Search,
  Activity,
} from "lucide-react";

import type { NavGroupConfig } from "@/lib/nav-config.types";
import { OPERATOR_NAV_GROUP_LABELS, OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";

import { NavGroupBuilderBase } from "@/lib/nav-group-builder-base";

/** Operate · advanced analysis — every link sets `requiredAuthority`. */
export class OperateAnalysisNavGroupBuilder extends NavGroupBuilderBase {
  build(): NavGroupConfig {
    return {
      id: "operate-analysis",
      label: OPERATOR_NAV_GROUP_LABELS.analysis,
      surface: "review-workflow",
      caption:
        "Comparisons, Ask, search, and advisory scans — expand when you need deeper investigation beyond the review path.",
      links: [
        {
          href: "/compare",
          label: OPERATOR_NAV_LINK_LABELS.compareTwoReviews,
          title: this.shortcutTitle("Diff two reviews (base vs target)", "alt+c"),
          keyShortcut: "alt+c",
          icon: GitCompare,
          tier: "extended",
          requiredAuthority: "ReadAuthority",
        },
        {
          href: "/replay",
          label: OPERATOR_NAV_LINK_LABELS.replayReview,
          title: this.shortcutTitle("Replay a review — re-validate stored pipeline output", "alt+p"),
          keyShortcut: "alt+p",
          icon: Play,
          tier: "extended",
          requiredAuthority: "ExecuteAuthority",
        },
        {
          href: "/ask",
          label: OPERATOR_NAV_LINK_LABELS.askReview,
          title: this.shortcutTitle("Ask — natural language Q&A over architecture context", "alt+a"),
          keyShortcut: "alt+a",
          icon: MessageSquare,
          tier: "essential",
          requiredAuthority: "ReadAuthority",
        },
        {
          href: "/search",
          label: OPERATOR_NAV_LINK_LABELS.searchEvidence,
          title: "Search — indexed architecture content (optional review run filter)",
          icon: Search,
          tier: "advanced",
          requiredAuthority: "ReadAuthority",
        },
        {
          href: "/advisory",
          label: OPERATOR_NAV_LINK_LABELS.architectureAdvisory,
          title: "Architecture advisory — architecture scans and scan schedules",
          icon: Activity,
          tier: "advanced",
          requiredAuthority: "ReadAuthority",
        },
      ],
    };
  }
}
