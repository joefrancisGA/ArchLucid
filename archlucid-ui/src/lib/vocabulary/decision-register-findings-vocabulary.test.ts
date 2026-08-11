import { describe, expect, it } from "vitest";

import {
  DECISION_REGISTER_FINDINGS_COMPACT_LINE,
  DECISION_REGISTER_FINDINGS_HEADING,
  DECISION_REGISTER_FINDINGS_QUEUE_LINK,
  DECISION_REGISTER_FINDINGS_REGISTER_LINK,
  DECISION_REGISTER_FINDINGS_WHY_TWO,
  buildDecisionRegisterFindingsVocabulary,
  resolveDecisionRegisterFindingsPeerLink,
} from "@/lib/vocabulary/decision-register-findings-vocabulary";
import {
  GOVERNANCE_DECISION_REGISTER_PATH,
  GOVERNANCE_FINDINGS_PATH,
} from "@/lib/governance-route-paths";

describe("decision-register-findings-vocabulary (TB-2291)", () => {
  it("explains decision register locked dispositions vs findings queue triage", () => {
    const model = buildDecisionRegisterFindingsVocabulary();

    expect(model.heading).toBe(DECISION_REGISTER_FINDINGS_HEADING);
    expect(model.heading.toLowerCase()).toContain("decision register");
    expect(model.heading.toLowerCase()).toContain("findings");
    expect(model.whyTwo).toBe(DECISION_REGISTER_FINDINGS_WHY_TWO);
    expect(model.whyTwo.toLowerCase()).toContain("locked");
    expect(model.whyTwo.toLowerCase()).toContain("triage");
    expect(model.compactLine).toBe(DECISION_REGISTER_FINDINGS_COMPACT_LINE);

    expect(model.decisionRegisterLink).toEqual(DECISION_REGISTER_FINDINGS_REGISTER_LINK);
    expect(model.decisionRegisterLink.href).toBe(GOVERNANCE_DECISION_REGISTER_PATH);
    expect(model.decisionRegisterLink.href).toBe("/governance/decision-register");

    expect(model.findingsQueueLink).toEqual(DECISION_REGISTER_FINDINGS_QUEUE_LINK);
    expect(model.findingsQueueLink.href).toBe(GOVERNANCE_FINDINGS_PATH);
    expect(model.findingsQueueLink.href).toBe("/governance/findings");
  });

  it("resolves the peer surface from decision register and findings queue", () => {
    expect(resolveDecisionRegisterFindingsPeerLink("decision-register")).toEqual(
      DECISION_REGISTER_FINDINGS_QUEUE_LINK,
    );

    expect(resolveDecisionRegisterFindingsPeerLink("findings-queue")).toEqual(
      DECISION_REGISTER_FINDINGS_REGISTER_LINK,
    );
  });
});
