import { describe, expect, it } from "vitest";

import {
  buildPolicyPackEnforcedRuleRows,
  formatActivePolicyPackSummaryBody,
} from "@/lib/policy/policy-pack-enforced-rules";
import { policyPackBuyerLabel } from "@/lib/policy/policy-pack-buyer-label";
import { SHOWCASE_PHI_FINDING_GRAPH_NODE_ID } from "@/lib/findings/finding-inspect-graph-evidence";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import type { EffectivePolicyPackSet, PolicyPackContentDocument } from "@/types/policy-packs";

const showcaseRunEnc = encodeURIComponent(SHOWCASE_STATIC_DEMO_RUN_ID);

const effectiveContent: PolicyPackContentDocument = {
  complianceRuleIds: [],
  complianceRuleKeys: ["phi.minimization.intake"],
  alertRuleIds: [],
  compositeAlertRuleIds: [],
  advisoryDefaults: {},
  metadata: { ruleSetId: "healthcare-claims-v3", vertical: "healthcare" },
};

const effectivePacks: EffectivePolicyPackSet = {
  tenantId: "demo-tenant",
  workspaceId: "demo-workspace",
  projectId: "default",
  packs: [
    {
      policyPackId: "demo-healthcare-claims-pack",
      name: policyPackBuyerLabel("healthcare-claims-v3", "3.4.1"),
      version: "3.4.1",
      packType: "BuiltIn",
      contentJson: "{}",
    },
  ],
};

describe("buildPolicyPackEnforcedRuleRows", () => {
  it("maps known compliance rule keys to buyer-facing labels and evidence links", () => {
    const rows = buildPolicyPackEnforcedRuleRows(effectiveContent, effectivePacks.packs);

    expect(rows).toHaveLength(1);
    expect(rows[0]?.ruleName).toBe("PHI minimization on intake APIs");
    expect(rows[0]?.category).toBe("Privacy");
    expect(rows[0]?.enforcementMode).toBe("Required");
    expect(rows[0]?.sourcePackLabel).toBe(policyPackBuyerLabel("healthcare-claims-v3", "3.4.1"));
    expect(rows[0]?.evidenceHref).toBe(
      `/insights/evidence-graph?runId=${showcaseRunEnc}&graphNodeId=${encodeURIComponent(SHOWCASE_PHI_FINDING_GRAPH_NODE_ID)}`,
    );
  });

  it("humanizes unknown rule keys", () => {
    const rows = buildPolicyPackEnforcedRuleRows(
      {
        ...effectiveContent,
        complianceRuleKeys: ["custom.rule.key"],
      },
      effectivePacks.packs,
    );

    expect(rows[0]?.ruleName).toBe("Custom Rule Key");
    expect(rows[0]?.evidenceHref).toBeNull();
  });
});

describe("formatActivePolicyPackSummaryBody", () => {
  it("uses singular rule copy for one enforced rule", () => {
    expect(formatActivePolicyPackSummaryBody("Healthcare Claims Policy Pack v3.4.1", 1)).toBe(
      "Healthcare Claims Policy Pack v3.4.1 is enabled for this workspace and applies 1 rule to this review.",
    );
  });

  it("uses plural rule copy for multiple enforced rules", () => {
    expect(formatActivePolicyPackSummaryBody("Healthcare Claims Policy Pack v3.4.1", 2)).toContain(
      "applies 2 rules to this review.",
    );
  });
});
