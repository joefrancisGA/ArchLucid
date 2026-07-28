import {
  Brain,
  Kanban,
  MessageSquareText,
} from "lucide-react";

import type { NavGroupConfig } from "@/lib/nav-config.types";
import { BUYER_TERMINOLOGY } from "@/lib/buyer-surface-vocabulary";
import { OPERATOR_NAV_GROUP_LABELS, OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";

import { NavGroupBuilderBase } from "@/lib/nav-group-builder-base";

/** Operate · architect programs — advisory, tuning, and planning beyond core Insights (TB-647). */
export class OperateArchitectAdvancedNavGroupBuilder extends NavGroupBuilderBase {
  build(): NavGroupConfig {
    return {
      id: "operate-architect-advanced",
      label: OPERATOR_NAV_GROUP_LABELS.architectPrograms,
      surface: "review-workflow",
      caption: "Improvement themes and planning.",
      links: [
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
        {
          href: "/architecture-intelligence",
          label: "Architecture intelligence",
          title: "Architecture intelligence — closed-loop reasoning and golden regression checks",
          icon: Brain,
          tier: "advanced",
          requiredAuthority: "ExecuteAuthority",
        },
      ],
    };
  }
}
