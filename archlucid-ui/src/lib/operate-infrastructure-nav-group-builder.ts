import {
  Boxes,
  Factory,
  GitCompareArrows,
  GitMerge,
  LayoutDashboard,
  MessageCircleQuestion,
  Network,
} from "lucide-react";

import type { NavGroupConfig } from "@/lib/nav-config.types";
import {
  GOVERNANCE_INFRASTRUCTURE_ASK_PATH,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_PATH,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PATH,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_PATH,
  GOVERNANCE_INFRASTRUCTURE_TERRAFORM_PATH,
  GOVERNANCE_INFRASTRUCTURE_PATH,
  GOVERNANCE_INFRASTRUCTURE_REMEDIATION_PATH,
  GOVERNANCE_INFRASTRUCTURE_RESOURCES_PATH,
} from "@/lib/governance/governance-infrastructure-route-paths";
import { OPERATOR_NAV_GROUP_LABELS, OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";

import { NavGroupBuilderBase } from "@/lib/nav-group-builder-base";

/** Operate · infrastructure evidence — snapshots, diagrams, hub, Ask, and remediation workbenches. */
export class OperateInfrastructureNavGroupBuilder extends NavGroupBuilderBase {
  build(): NavGroupConfig {
    return {
      id: "operate-infrastructure",
      label: OPERATOR_NAV_GROUP_LABELS.infrastructure,
      surface: "review-workflow",
      caption:
        "Explore Azure inventory snapshots, diagrams, resource evidence, grounded Ask, and remediation instances.",
      links: [
        {
          // String literal required: scripts/ci/assert_route_tier_policy_nav.py parses href:"..." only.
          href: "/governance/infrastructure" as typeof GOVERNANCE_INFRASTRUCTURE_PATH,
          label: OPERATOR_NAV_LINK_LABELS.infrastructureOverview,
          title: "Infrastructure evidence overview and workbench directory",
          icon: LayoutDashboard,
          tier: "extended",
          requiredAuthority: "ReadAuthority",
        },
        {
          href: "/governance/infrastructure/drift" as typeof GOVERNANCE_INFRASTRUCTURE_DRIFT_PATH,
          label: OPERATOR_NAV_LINK_LABELS.infrastructureDrift,
          title: "Compare snapshots, review drift classifications, and export advisory Terraform",
          icon: GitCompareArrows,
          tier: "extended",
          requiredAuthority: "ReadAuthority",
        },
        {
          href: "/governance/infrastructure/terraform" as typeof GOVERNANCE_INFRASTRUCTURE_TERRAFORM_PATH,
          label: OPERATOR_NAV_LINK_LABELS.infrastructureTerraform,
          title: "Review advisory Terraform mapping reconstructed from inventory evidence",
          icon: GitCompareArrows,
          tier: "extended",
          requiredAuthority: "ReadAuthority",
        },
        {
          href: "/governance/infrastructure/diagrams" as typeof GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PATH,
          label: OPERATOR_NAV_LINK_LABELS.infrastructureDiagrams,
          title: "Render inventory diagrams with partitioned fallbacks for large graphs",
          icon: Network,
          tier: "extended",
          requiredAuthority: "ReadAuthority",
        },
        {
          href: "/governance/infrastructure/diagram-reconcile" as typeof GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_PATH,
          label: OPERATOR_NAV_LINK_LABELS.infrastructureDiagramReconcile,
          title: "Reconcile diagrams against inventory snapshots with explainable correspondence",
          icon: GitMerge,
          tier: "extended",
          requiredAuthority: "ReadAuthority",
        },
        {
          href: "/governance/infrastructure/resources" as typeof GOVERNANCE_INFRASTRUCTURE_RESOURCES_PATH,
          label: OPERATOR_NAV_LINK_LABELS.infrastructureResources,
          title: "Search cloud resources and open the per-resource evidence hub",
          icon: Boxes,
          tier: "extended",
          requiredAuthority: "ReadAuthority",
        },
        {
          href: "/governance/infrastructure/ask" as typeof GOVERNANCE_INFRASTRUCTURE_ASK_PATH,
          label: OPERATOR_NAV_LINK_LABELS.infrastructureAsk,
          title: "Ask grounded questions about inventory evidence with citations",
          icon: MessageCircleQuestion,
          tier: "extended",
          requiredAuthority: "ReadAuthority",
        },
        {
          href: "/governance/infrastructure/remediation" as typeof GOVERNANCE_INFRASTRUCTURE_REMEDIATION_PATH,
          label: OPERATOR_NAV_LINK_LABELS.infrastructureRemediation,
          title: "Track remediation instances and waves with advisory-only execute honesty",
          icon: Factory,
          tier: "extended",
          requiredAuthority: "ReadAuthority",
        },
      ],
    };
  }
}
