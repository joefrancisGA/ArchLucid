import type { PolicyPackContentDocument, ResolvedPolicyPack } from "@/types/policy-packs";
import { SHOWCASE_PHI_FINDING_GRAPH_NODE_ID } from "@/lib/findings/finding-inspect-graph-evidence";
import { policyPackBuyerLabel } from "@/lib/policy/policy-pack-buyer-label";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

const showcaseRunEnc = encodeURIComponent(SHOWCASE_STATIC_DEMO_RUN_ID);
const showcaseGraphBase = `/insights/evidence-graph?runId=${showcaseRunEnc}`;

export type PolicyPackEnforcedRuleRow = {
  readonly ruleKey: string;
  readonly ruleName: string;
  readonly category: string;
  readonly enforcementMode: string;
  readonly sourcePackLabel: string;
  readonly evidenceHref: string | null;
};

type KnownRulePresentation = Omit<PolicyPackEnforcedRuleRow, "ruleKey" | "sourcePackLabel">;

const KNOWN_RULE_PRESENTATION: Readonly<Record<string, KnownRulePresentation>> = {
  "phi.minimization.intake": {
    ruleName: "PHI minimization on intake APIs",
    category: "Privacy",
    enforcementMode: "Required",
    evidenceHref: `${showcaseGraphBase}&graphNodeId=${encodeURIComponent(SHOWCASE_PHI_FINDING_GRAPH_NODE_ID)}`,
  },
  "claims.intake.boundary": {
    ruleName: "Trust boundary for claims intake",
    category: "Security",
    enforcementMode: "Required",
    evidenceHref: showcaseGraphBase,
  },
};

function humanizeRuleKey(ruleKey: string): string {
  return ruleKey
    .split(/[./_-]+/)
    .filter((segment) => segment.length > 0)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function resolveSourcePackLabel(
  effectivePacks: readonly ResolvedPolicyPack[],
  ruleSetId: string | undefined,
): string {
  if (effectivePacks.length === 0) {
    return "—";
  }

  const primary = effectivePacks[0];
  const metadataRuleSetId = ruleSetId?.trim() ?? "";

  if (metadataRuleSetId.length > 0) {
    return policyPackBuyerLabel(metadataRuleSetId, primary.version);
  }

  return primary.name;
}

export function buildPolicyPackEnforcedRuleRows(
  effectiveContent: PolicyPackContentDocument | null,
  effectivePacks: readonly ResolvedPolicyPack[],
): readonly PolicyPackEnforcedRuleRow[] {
  const keys = effectiveContent?.complianceRuleKeys?.filter((key) => (key ?? "").trim().length > 0) ?? [];
  const ruleSetId = effectiveContent?.metadata?.ruleSetId;
  const sourcePackLabel = resolveSourcePackLabel(effectivePacks, ruleSetId);

  return keys.map((ruleKey) => {
    const trimmedKey = ruleKey.trim();
    const known = KNOWN_RULE_PRESENTATION[trimmedKey];

    if (known !== undefined) {
      return {
        ruleKey: trimmedKey,
        sourcePackLabel,
        ...known,
      };
    }

    return {
      ruleKey: trimmedKey,
      ruleName: humanizeRuleKey(trimmedKey),
      category: "Compliance",
      enforcementMode: "Required",
      sourcePackLabel,
      evidenceHref: null,
    };
  });
}

export function formatActivePolicyPackSummaryBody(packName: string, ruleCount: number): string {
  const ruleLabel = ruleCount === 1 ? "1 rule" : `${ruleCount} rules`;

  return `${packName} is enabled for this workspace and applies ${ruleLabel} to this review.`;
}
