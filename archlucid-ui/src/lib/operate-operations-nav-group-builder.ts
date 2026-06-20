import {
  BarChart3,
  CalendarClock,
  ClipboardList,
  FileSearch,
  FileText,
  GitBranch,
  HeartPulse,
  LineChart,
  Plug,
  Sparkles,
} from "lucide-react";

import type { NavGroupConfig } from "@/lib/nav-config.types";
import { OPERATOR_NAV_GROUP_LABELS, OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";

import { NavGroupBuilderBase } from "@/lib/nav-group-builder-base";

/** Operate · operations rhythm — scorecard, schedules, tuning, and platform health. */
export class OperateOperationsNavGroupBuilder extends NavGroupBuilderBase {
  build(): NavGroupConfig {
    return {
      id: "operate-operations",
      label: OPERATOR_NAV_GROUP_LABELS.operations,
      surface: "review-workflow",
      caption: "Scorecard, recurrence, tuning, portfolio operations, and system health.",
      links: [
        {
          href: "/scorecard",
          label: OPERATOR_NAV_LINK_LABELS.scorecard,
          title: "Pilot scorecard — finalized-review metrics and ROI baselines",
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
          title: "Pilot feedback — rollups and triage (58R)",
          icon: ClipboardList,
          tier: "advanced",
          requiredAuthority: "ReadAuthority",
        },
        {
          href: "/portfolio",
          label: "Portfolio Dashboard",
          title: "Portfolio Dashboard — cross-tenant aggregated ROI and risk metrics",
          icon: BarChart3,
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
