import { describe, expect, it } from "vitest";

import {
  FINDING_CAUSAL_STEP_MISSING,
  buildFindingCausalMiniChain,
  findingCausalMiniChainFromGovernanceQueueRow,
  findingCausalMiniChainFromInspectPayload,
  findingCausalMiniChainFromQuickDecisionFinding,
} from "@/lib/finding-causal-mini-chain";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";
import type { GovernanceFindingQueueRow } from "@/app/(operator)/governance/findings/governance-finding-queue-row";
import type { FindingInspectPayload } from "@/types/finding-inspect";

describe("buildFindingCausalMiniChain (TB-2217)", () => {
  it("builds rule → evidence → recommendation when fields are present", () => {
    const chain = buildFindingCausalMiniChain({
      ruleName: "Require private endpoints",
      evidenceRefCount: 2,
      recommendation: "Lock down public ingress. Then re-run the review.",
    });

    expect(chain.hasAnyValue).toBe(true);
    expect(chain.steps.map((step) => step.key)).toEqual(["rule", "evidence", "recommendation"]);
    expect(chain.steps[0]?.value).toBe("Require private endpoints");
    expect(chain.steps[1]?.value).toBe("2 cited evidence references");
    expect(chain.steps[2]?.value).toBe("Lock down public ingress.");
  });

  it("returns honest empties when fields are missing", () => {
    const chain = buildFindingCausalMiniChain({});

    expect(chain.hasAnyValue).toBe(false);
    expect(chain.steps.every((step) => step.value === null)).toBe(true);
    expect(FINDING_CAUSAL_STEP_MISSING).toBe("Not available");
  });

  it("maps quick-decision, governance queue, and inspect payloads", () => {
    const finding = {
      findingId: "f1",
      title: "Title",
      recommendation: "Remediate storage account.",
      severityValue: 2,
      findingOrder: 0,
      aiReasoning: {
        wireJson: JSON.stringify({ decisionRuleName: "Storage rule", decisionRuleId: "r1" }),
        reasoningTrace: "",
      },
      isMuted: false,
      muteReason: null,
      evidenceRefCount: 1,
      enforcementTier: "Advisory",
    } as QuickDecisionFinding;

    const fromFinding = findingCausalMiniChainFromQuickDecisionFinding(finding);
    expect(fromFinding.steps[0]?.value).toBe("Storage rule");
    expect(fromFinding.steps[2]?.value).toContain("Remediate");

    const row = {
      runId: "run-1",
      runLabel: "Run",
      manifestId: "-",
      findingId: "f1",
      title: "Finding",
      severity: "High",
      category: "security",
      status: "Open",
      recommended: "Fix it.",
      recordKind: "finding",
      policyRuleId: "sec.private-endpoint",
      evidenceRefCount: 3,
    } as GovernanceFindingQueueRow;

    const fromRow = findingCausalMiniChainFromGovernanceQueueRow(row);
    expect(fromRow?.hasAnyValue).toBe(true);
    expect(fromRow?.steps[1]?.value).toBe("3 cited evidence references");

    const decisionRow = { ...row, recordKind: "decision" as const };
    expect(findingCausalMiniChainFromGovernanceQueueRow(decisionRow)).toBeNull();

    const payload = {
      findingId: "f1",
      typedPayload: null,
      decisionRuleId: "rule-1",
      decisionRuleName: "Inspect rule",
      evidence: [{ artifactId: "a1", lineRange: null, excerpt: null }],
      recommendedActions: ["Rotate keys."],
      auditRowId: null,
      runId: "run-1",
      manifestVersion: null,
    } as FindingInspectPayload;

    const fromInspect = findingCausalMiniChainFromInspectPayload(payload);
    expect(fromInspect.steps[0]?.value).toBe("Inspect rule");
    expect(fromInspect.steps[2]?.value).toBe("Rotate keys.");
  });
});