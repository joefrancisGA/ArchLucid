import { describe, expect, it } from "vitest";



import { FOCUSED_PILOT_MODE_PACK_DISPLAY_NAMES } from "@/lib/focused-pilot-mode-policy-packs";

import {

  buildStandardsRuleRows,

  buildStandardsRulesSummary,

  filterStandardsRuleRows,

  EMPTY_STANDARDS_RULES_FILTER_STATE,

} from "@/lib/standards-rules-rows";

import type { EffectiveGovernanceResolutionResult } from "@/types/governance-resolution";



const emptyData: EffectiveGovernanceResolutionResult = {

  tenantId: "demo",

  workspaceId: "demo",

  projectId: "default",

  effectiveContent: {

    complianceRuleIds: [],

    complianceRuleKeys: [],

    alertRuleIds: [],

    compositeAlertRuleIds: [],

    advisoryDefaults: {},

    metadata: {},

  },

  decisions: [],

  conflicts: [],

  notes: [],

};



describe("buildStandardsRuleRows", () => {

  it("returns one rule per focused-pilot architecture-quality pack in buyer fallback mode", () => {

    const rows = buildStandardsRuleRows(emptyData, { useShowcaseFallback: true });



    expect(rows).toHaveLength(FOCUSED_PILOT_MODE_PACK_DISPLAY_NAMES.length);

    expect(rows.some((row) => row.ruleName === "MFA enforced for privileged access")).toBe(true);

    expect(rows.some((row) => row.ruleName === "Failure modes identified for critical dependencies")).toBe(true);

    expect(rows.every((row) => row.sourcePolicyPackHref?.includes("/governance/policy-packs/"))).toBe(true);

    expect(rows.every((row) => row.sourcePolicyPackProvenanceLabel === "Platform default")).toBe(true);

    expect(rows.every((row) => !row.sourcePolicyPack.startsWith("ArchLucid"))).toBe(true);

    expect(new Set(rows.map((row) => row.sourcePolicyPack)).size).toBe(

      FOCUSED_PILOT_MODE_PACK_DISPLAY_NAMES.length,

    );

  });



  it("maps API compliance rule keys to presentation rows", () => {

    const rows = buildStandardsRuleRows({

      ...emptyData,

      effectiveContent: {

        ...emptyData.effectiveContent,

        complianceRuleKeys: ["sec-base-001"],

      },

      decisions: [

        {

          itemType: "complianceRule",

          itemKey: "sec-base-001",

          winningPolicyPackId: "security-architecture-baseline",

          winningPolicyPackName: "Security Architecture Baseline",

          winningVersion: "1.1.1",

          winningScopeLevel: "tenant",

          resolutionReason: "Tenant baseline wins.",

          candidates: [],

        },

      ],

    });



    expect(rows).toHaveLength(1);

    expect(rows[0]?.ruleName).toBe("MFA enforced for privileged access");

    expect(rows[0]?.sourcePolicyPackHref).toBe("/governance/policy-packs/security-architecture-baseline");

    expect(rows[0]?.sourcePolicyPackProvenanceLabel).toBe("Platform default");

  });

});



describe("filterStandardsRuleRows", () => {

  it("filters by severity and linked findings", () => {

    const rows = buildStandardsRuleRows(emptyData, { useShowcaseFallback: true });

    const highSeverity = filterStandardsRuleRows(rows, {

      ...EMPTY_STANDARDS_RULES_FILTER_STATE,

      severity: "High",

    });

    const linkedOnly = filterStandardsRuleRows(rows, {

      ...EMPTY_STANDARDS_RULES_FILTER_STATE,

      linkedFindings: "linked",

    });



    expect(highSeverity.every((row) => row.severity === "High")).toBe(true);

    expect(linkedOnly.every((row) => row.linkedFindingsHref !== null)).toBe(true);

  });

});



describe("buildStandardsRulesSummary", () => {

  it("counts unique standards, linked findings, evidence coverage, and contributing packs", () => {

    const rows = buildStandardsRuleRows(emptyData, { useShowcaseFallback: true });

    const summary = buildStandardsRulesSummary(rows);



    expect(summary.rulesEnforced).toBe(rows.length);

    expect(summary.standardsInScope).toBeGreaterThan(0);

    expect(summary.rulesWithLinkedFindings).toBeGreaterThan(0);

    expect(summary.evidencedRules).toBeGreaterThan(0);

    expect(summary.evidencedRules).toBeLessThan(rows.length);

    expect(summary.evidenceCoverageLabel).toMatch(/%$/);

    expect(summary.contributingPolicyPacks).toHaveLength(FOCUSED_PILOT_MODE_PACK_DISPLAY_NAMES.length);

  });

});


