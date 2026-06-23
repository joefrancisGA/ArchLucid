import {
  BarChart3,
  CalendarClock,
  ClipboardList,
  FileSearch,
  FileText,
  GitBranch,
  HeartPulse,
  LineChart,
  MessageSquare,
  Play,
  Plug,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import type { NavGroupConfig } from "@/lib/nav-config.types";
import { BUYER_TERMINOLOGY } from "@/lib/buyer-surface-vocabulary";
import { OPERATOR_NAV_GROUP_LABELS, OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";

import { NavGroupBuilderBase } from "@/lib/nav-group-builder-base";

/** Operate · operations rhythm — connectors, recurrence, tuning, feedback, and system health. */
export class OperateOperationsNavGroupBuilder extends NavGroupBuilderBase {
  build(): NavGroupConfig {
    return {
      id: "operate-operations",
      label: OPERATOR_NAV_GROUP_LABELS.operations,
      surface: "review-workflow",
      caption: "Connectors, recurrence, tuning, adoption feedback, replay, and system health.",
      links: [
        {
          href: "/scorecard",
          label: OPERATOR_NAV_LINK_LABELS.scorecard,
          title: `${BUYER_TERMINOLOGY.reviewScorecard} — finalized-review metrics and ROI baselines`,
          icon: BarChart3,
          tier: "extended",
          requiredAuthority: "ReadAuthority",
        },
        {
          href: "/governance/recurrence-schedules",
          label: OPERATOR_NAV_LINK_LABELS.recurrenceSchedules,
          title: "Recurrence schedules — automated follow-up architecture reviews after commit",
          icon: CalendarClock,
          tier: "extended",
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
          title: `${BUYER_TERMINOLOGY.evaluationFeedback} — recurring issues and improvement opportunities (advanced)`,
          icon: ClipboardList,
          tier: "advanced",
          requiredAuthority: "ReadAuthority",
        },
        {
          href: "/integrations/operations",
          label: OPERATOR_NAV_LINK_LABELS.connectorOperations,
          title: "Connector operations — integration readiness and connectivity status",
          icon: Plug,
          tier: "advanced",
          requiredAuthority: "ReadAuthority",
        },
        {
          href: "/integrations/teams",
          label: OPERATOR_NAV_LINK_LABELS.teamsNotifications,
          title: "Teams notifications — Key Vault reference for incoming webhook fan-out",
          icon: MessageSquare,
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
          href: "/replay",
          label: OPERATOR_NAV_LINK_LABELS.replayReview,
          title: this.shortcutTitle("Validate review package — check stored review output integrity", "alt+p"),
          keyShortcut: "alt+p",
          icon: Play,
          tier: "extended",
          requiredAuthority: "ExecuteAuthority",
        },
        {
          href: "/workspace/security-trust",
          label: OPERATOR_NAV_LINK_LABELS.securityTrust,
          title: "Security & trust — published assessments, CAIQ/SIG, trust-center links",
          icon: ShieldCheck,
          tier: "extended",
          requiredAuthority: "ReadAuthority",
        },
        {
          href: "/governance/first-30-days",
          label: OPERATOR_NAV_LINK_LABELS.first30DaysGovernance,
          title: "First 30 days — minimal governance operating preset after evaluation",
          icon: ShieldCheck,
          tier: "extended",
          requiredAuthority: "ReadAuthority",
        },
        {
          href: "/value-report",
          label: OPERATOR_NAV_LINK_LABELS.valueReport,
          title: "Value report — sponsor DOCX from ROI_MODEL-aligned tenant metrics",
          icon: FileText,
          tier: "advanced",
          requiredAuthority: "ExecuteAuthority",
        },
        {
          href: "/planning",
          label: OPERATOR_NAV_LINK_LABELS.planning,
          title: "Planning — improvement themes and prioritized plans",
          icon: BarChart3,
          tier: "advanced",
          requiredAuthority: "ExecuteAuthority",
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
          href: "/value-report/pilot",
          label: OPERATOR_NAV_LINK_LABELS.pilotValueReport,
          title: `${BUYER_TERMINOLOGY.evaluationValueReport} — finalized-review metrics, governance signals, Markdown export`,
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
