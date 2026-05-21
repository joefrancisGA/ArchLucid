import {
  Activity,
  BarChart3,
  ClipboardList,
  FileSearch,
  FileText,
  GitBranch,
  GitCompare,
  HeartPulse,
  LineChart,
  MessageSquare,
  Plug,
  Play,
  Search,
  Sparkles,
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
        "Comparisons, replay, advisory (advanced), Ask, extended reporting, and digests once you leave the baseline review lane. Evidence trail is on the pilot path.",
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
        {
          href: "/recommendation-learning",
          label: OPERATOR_NAV_LINK_LABELS.recommendationTuning,
          title: "Recommendation tuning — profiles and ranking signals",
          icon: Sparkles,
          tier: "advanced",
          requiredAuthority: "ReadAuthority",
        },
        {
          href: "/product-learning",
          label: OPERATOR_NAV_LINK_LABELS.pilotFeedback,
          title: "Pilot feedback — rollups and triage (58R)",
          icon: ClipboardList,
          tier: "advanced",
          requiredAuthority: "ReadAuthority",
        },
        {
          href: "/planning",
          label: OPERATOR_NAV_LINK_LABELS.planning,
          title: "Planning — improvement themes and prioritized plans (59R)",
          icon: BarChart3,
          tier: "advanced",
          requiredAuthority: "ExecuteAuthority",
        },
        {
          href: "/evolution-review",
          label: OPERATOR_NAV_LINK_LABELS.evolutionCandidates,
          title: "Evolution candidates — simulations and before/after review (60R)",
          icon: GitBranch,
          tier: "advanced",
          requiredAuthority: "ExecuteAuthority",
        },
        {
          href: "/value-report/pilot",
          label: OPERATOR_NAV_LINK_LABELS.pilotValueReport,
          title: "Pilot value report — finalized-review metrics, governance signals, Markdown export",
          icon: FileText,
          tier: "extended",
          requiredAuthority: "ReadAuthority",
        },
        {
          href: "/value-report/roi",
          label: OPERATOR_NAV_LINK_LABELS.roiReport,
          title: "ROI report — hours estimate from severities and pre-finalize audit blocks",
          icon: LineChart,
          tier: "extended",
          requiredAuthority: "ReadAuthority",
        },
        {
          href: "/integrations/operations",
          label: OPERATOR_NAV_LINK_LABELS.connectorOperations,
          title: "Connector operations — readiness, smoke signals, and Service Bus posture",
          icon: Plug,
          tier: "extended",
          requiredAuthority: "ReadAuthority",
        },
        {
          href: "/health",
          label: OPERATOR_NAV_LINK_LABELS.systemHealth,
          title: "System health — API liveness, readiness, and critical dependencies",
          icon: HeartPulse,
          tier: "extended",
          requiredAuthority: "ReadAuthority",
        },
        {
          href: "/digests",
          label: OPERATOR_NAV_LINK_LABELS.digests,
          title: "Digests — generated digests, subscriptions, and sponsor schedule",
          icon: FileSearch,
          tier: "advanced",
          requiredAuthority: "ReadAuthority",
        },
      ],
    };
  }
}
