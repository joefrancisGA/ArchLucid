import { describe, expect, it } from "vitest";

import {
  buildFindingDerivationSentence,
  FINDING_DERIVATION_ASSEMBLED_RULE_ONLY_PREFIX,
  FINDING_DERIVATION_EVIDENCE_REF_COUNT_NOT_STORED,
  FINDING_DERIVATION_NOT_AVAILABLE,
  FINDING_DERIVATION_NOT_STORED,
  FINDING_DERIVATION_STORED_EMPTY,
  findingDerivationFromGovernanceQueueRow,
  findingDerivationFromQuickDecisionFinding,
} from "@/lib/findings/finding-derivation-sentence";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";
import type { GovernanceFindingQueueRow } from "@/app/(operator)/governance/findings/governance-finding-queue-row";

function sampleQuickDecisionFinding(overrides: Partial<QuickDecisionFinding> = {}): QuickDecisionFinding {
  return {
    findingId: "finding-1",
    title: "Public ingress",
    recommendation: "Restrict ingress.",
    severityValue: 3,
    findingOrder: 0,
    aiReasoning: {
      wireJson: JSON.stringify({
        decisionRuleName: "Security baseline ingress rule",
        reasoningSummary: "Evidence shows public ingress on the intake API.",
      }),
      reasoningTrace: "",
    },
    isMuted: false,
    muteReason: null,
    enforcementTier: "blocking",
    ...overrides,
  };
}

function sampleGovernanceRow(overrides: Partial<GovernanceFindingQueueRow> = {}): GovernanceFindingQueueRow {
  return {
    runId: "run-1",
    runLabel: "Claims intake",
    manifestId: "manifest-1",
    findingId: "finding-1",
    title: "Public ingress",
    severity: "High",
    category: "sec-base-010",
    status: "Open",
    recommended: "Review ingress controls.",
    recordKind: "finding",
    evidenceRefCount: 2,
    ...overrides,
  };
}

describe("finding-derivation-sentence (TB-2154)", () => {
  it("prefers API reasoningSummary when present", () => {
    const result = buildFindingDerivationSentence({
      ruleName: "Ignored rule",
      reasoningSummary: "Evidence shows public ingress on the intake API.",
      severityLabel: "High",
      evidenceRefCount: 2,
    });

    expect(result.synthesised).toBe(false);
    expect(result.sentence).toBe("Evidence shows public ingress on the intake API.");
  });

  it("notes when stored reasoning continues after the first sentence (P-18)", () => {
    const result = buildFindingDerivationSentence({
      reasoningSummary: "First sentence here. Second sentence continues.",
      severityLabel: "High",
    });

    expect(result.sentence).toContain("Full recommendation was stored");
    expect(result.sentence).toContain("First sentence here.");
  });

  it("uses severity omission copy without wrapping it in a severity finding clause", () => {
    const result = buildFindingDerivationSentence({
      ruleName: "Ingress rule",
      severityLabel: null,
      evidenceRefCount: 1,
    });

    expect(result.sentence).toContain("Severity was not stored.");
    expect(result.sentence).not.toContain("severity finding");
  });

  it("synthesizes rule, evidence, and severity when reasoning is absent", () => {
    const result = buildFindingDerivationSentence({
      ruleName: "PHI minimization at intake",
      severityLabel: "High",
      evidenceRefCount: 3,
    });

    expect(result.synthesised).toBe(true);
    expect(result.sentence).toContain(
      "Assembled from stored rule and evidence fields, not a stored explanation.",
    );
    expect(result.sentence).toContain('Policy rule "PHI minimization at intake"');
    expect(result.sentence).toContain("3 cited evidence references");
    expect(result.sentence).toContain("High severity finding");
  });

  it("labels omitted evidence ref count when rule fields are present", () => {
    const result = buildFindingDerivationSentence({
      categoryLabel: "Security",
      severityLabel: "High",
    });

    expect(result.sentence).toBe(FINDING_DERIVATION_EVIDENCE_REF_COUNT_NOT_STORED);
  });

  it("labels category-only rows without quoting the category as a rule when ref count is stored", () => {
    const result = buildFindingDerivationSentence({
      categoryLabel: "Security",
      severityLabel: "High",
      evidenceRefCount: 0,
    });

    expect(result.sentence).toContain("Policy area Security. Rule name was not stored.");
    expect(result.sentence).not.toContain('Policy rule "Security"');
  });

  it("labels zero evidence refs and trace confidence separately (P-08)", () => {
    const result = buildFindingDerivationSentence({
      ruleName: "Ingress baseline",
      evidenceRefCount: 0,
      traceConfidenceLabel: "High",
      severityLabel: "High",
    });

    expect(result.sentence).toContain("No evidence references were stored");
    expect(result.sentence).toContain("This is not a cited evidence artifact.");
    expect(result.sentence).not.toContain("confidence trace evidence");
    expect(result.sentence).toContain(FINDING_DERIVATION_ASSEMBLED_RULE_ONLY_PREFIX);
  });

  it("labels a missing rule name with the rule id (P-10)", () => {
    const result = buildFindingDerivationSentence({
      ruleId: "sec-base-010",
      severityLabel: "High",
      evidenceRefCount: 1,
    });

    expect(result.sentence).toContain("Rule name was not stored. Rule id sec-base-010");
    expect(result.sentence).not.toContain('Policy rule "sec-base-010"');
  });

  it("returns honest unavailable copy when synthesis inputs are missing", () => {
    expect(buildFindingDerivationSentence({}).sentence).toBe(FINDING_DERIVATION_NOT_STORED);
  });

  it("labels absent reasoning as not stored and blank reasoning as stored empty (P-08)", () => {
    expect(buildFindingDerivationSentence({ reasoningSummary: null }).sentence).toBe(FINDING_DERIVATION_NOT_STORED);
    expect(buildFindingDerivationSentence({ reasoningSummary: "   " }).sentence).toBe(FINDING_DERIVATION_STORED_EMPTY);
  });

  it("derives from quick-decision finding wire JSON", () => {
    const result = findingDerivationFromQuickDecisionFinding(sampleQuickDecisionFinding());

    expect(result.sentence).toBe("Evidence shows public ingress on the intake API.");
  });

  it("derives from governance queue rows and skips decision rows", () => {
    const findingResult = findingDerivationFromGovernanceQueueRow(sampleGovernanceRow());

    expect(findingResult?.sentence).toContain("Rule name was not stored. Rule id sec-base-010");
    expect(findingResult?.sentence).toContain("2 cited evidence references");

    expect(
      findingDerivationFromGovernanceQueueRow(sampleGovernanceRow({ recordKind: "decision" })),
    ).toBeNull();
  });
});
