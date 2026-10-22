import { FOCUSED_PILOT_MODE_PACK_DISPLAY_NAMES } from "@/lib/focused-pilot-mode-policy-packs";
import { SHOWCASE_PHI_FINDING_GRAPH_NODE_ID } from "@/lib/findings/finding-inspect-graph-evidence";
import { governancePolicyPackDetailPath } from "@/lib/governance/governance-route-paths";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

const showcaseRunEnc = encodeURIComponent(SHOWCASE_STATIC_DEMO_RUN_ID);
const showcaseGraphBase = `/insights/evidence-graph?runId=${showcaseRunEnc}`;
const showcaseFindingsHref = `/governance/findings?runId=${showcaseRunEnc}`;

export type FocusedPilotShowcaseRuleSeed = {
  readonly ruleKey: string;
  readonly ruleName: string;
  readonly standardFramework: string;
  readonly category: string;
  readonly severity: string;
  readonly enforcementMode: string;
  readonly sourcePolicyPack: (typeof FOCUSED_PILOT_MODE_PACK_DISPLAY_NAMES)[number];
  readonly bundledPackSlug: string;
  readonly linkedFindingsLabel: string | null;
  readonly linkedFindingsHref: string | null;
  readonly evidenceHref: string | null;
};

/** One representative enforced rule per focused-pilot architecture-quality pack (matches backend allow-list). */
export const FOCUSED_PILOT_SHOWCASE_RULE_SEEDS: readonly FocusedPilotShowcaseRuleSeed[] = [
  {
    ruleKey: "sec-base-001",
    ruleName: "MFA enforced for privileged access",
    standardFramework: "CIS Azure Foundations",
    category: "Security",
    severity: "Critical",
    enforcementMode: "Required",
    sourcePolicyPack: "Security Architecture Baseline",
    bundledPackSlug: "security-architecture-baseline",
    linkedFindingsLabel: "1 finding",
    linkedFindingsHref: showcaseFindingsHref,
    evidenceHref: `${showcaseGraphBase}&graphNodeId=${encodeURIComponent(SHOWCASE_PHI_FINDING_GRAPH_NODE_ID)}`,
  },
  {
    ruleKey: "rel-base-001",
    ruleName: "Failure modes identified for critical dependencies",
    standardFramework: "ArchLucid Architecture Quality Baseline",
    category: "Reliability",
    severity: "High",
    enforcementMode: "Required",
    sourcePolicyPack: "Reliability and Resilience",
    bundledPackSlug: "reliability-and-resilience",
    linkedFindingsLabel: null,
    linkedFindingsHref: null,
    evidenceHref: null,
  },
  {
    ruleKey: "cost-opt-001",
    ruleName: "Virtual machine SKUs justified against workload class",
    standardFramework: "Microsoft Azure Well-Architected",
    category: "Cost",
    severity: "Medium",
    enforcementMode: "Required",
    sourcePolicyPack: "FinOps & Cloud Cost Optimization",
    bundledPackSlug: "cost-optimization",
    linkedFindingsLabel: null,
    linkedFindingsHref: null,
    evidenceHref: null,
  },
  {
    ruleKey: "perf-base-001",
    ruleName: "Workload and usage assumptions documented",
    standardFramework: "ArchLucid Architecture Quality Baseline",
    category: "Performance",
    severity: "High",
    enforcementMode: "Required",
    sourcePolicyPack: "Performance and Scalability",
    bundledPackSlug: "performance-and-scalability",
    linkedFindingsLabel: null,
    linkedFindingsHref: null,
    evidenceHref: null,
  },
  {
    ruleKey: "ops-base-001",
    ruleName: "Service and data ownership named",
    standardFramework: "ArchLucid Architecture Quality Baseline",
    category: "Operations",
    severity: "High",
    enforcementMode: "Required",
    sourcePolicyPack: "Operational Excellence",
    bundledPackSlug: "operational-excellence",
    linkedFindingsLabel: null,
    linkedFindingsHref: null,
    evidenceHref: null,
  },
  {
    ruleKey: "sust-base-001",
    ruleName: "Utilization assumptions for continuously allocated capacity",
    standardFramework: "ArchLucid Architecture Quality Baseline",
    category: "Sustainability",
    severity: "Medium",
    enforcementMode: "Advisory",
    sourcePolicyPack: "Sustainability and Resource Efficiency",
    bundledPackSlug: "sustainability-and-resource-efficiency",
    linkedFindingsLabel: null,
    linkedFindingsHref: null,
    evidenceHref: null,
  },
] as const;

export function focusedPilotShowcasePolicyPackHref(bundledPackSlug: string): string {
  return governancePolicyPackDetailPath(bundledPackSlug.trim());
}

export function findFocusedPilotShowcaseRuleSeed(ruleKey: string): FocusedPilotShowcaseRuleSeed | undefined {
  const trimmedKey = ruleKey.trim();

  return FOCUSED_PILOT_SHOWCASE_RULE_SEEDS.find((seed) => seed.ruleKey === trimmedKey);
}
