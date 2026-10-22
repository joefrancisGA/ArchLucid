import { describe, expect, it } from "vitest";

import {
  DECISION_REGISTER_EMPTY_TEACHING_BODY,
  DECISION_REGISTER_EMPTY_TEACHING_FINDINGS_ACTION,
  DECISION_REGISTER_EMPTY_TEACHING_HONESTY,
  DECISION_REGISTER_EMPTY_TEACHING_OPEN_REVIEWS_ACTION,
  DECISION_REGISTER_EMPTY_TEACHING_START_REVIEW_ACTION,
  DECISION_REGISTER_EMPTY_TEACHING_TITLE,
  buildDecisionRegisterEmptyTeaching,
} from "@/lib/decision-register-empty-teaching";
import { REVIEWS_LIST_PATH, REVIEWS_NEW_PATH } from "@/lib/architecture/architecture-routes";
import { GOVERNANCE_FINDINGS_CANONICAL_PATH } from "@/lib/governance/governance-findings-evidence-copy";
import { START_REVIEW_LABEL } from "@/lib/architecture/architecture-workflow-labels";

describe("decision-register-empty-teaching (TB-2263)", () => {
  it("teaches why the Decision register can be empty and deep-links next steps", () => {
    const model = buildDecisionRegisterEmptyTeaching();

    expect(model.title).toBe(DECISION_REGISTER_EMPTY_TEACHING_TITLE);
    expect(model.body).toBe(DECISION_REGISTER_EMPTY_TEACHING_BODY);
    expect(model.body.toLowerCase()).toContain("finalized review record");
    expect(model.honestyLine).toBe(DECISION_REGISTER_EMPTY_TEACHING_HONESTY);
    expect(model.honestyLine.toLowerCase()).toContain("findings queue");

    expect(model.actions).toEqual([
      DECISION_REGISTER_EMPTY_TEACHING_FINDINGS_ACTION,
      DECISION_REGISTER_EMPTY_TEACHING_START_REVIEW_ACTION,
      DECISION_REGISTER_EMPTY_TEACHING_OPEN_REVIEWS_ACTION,
    ]);

    expect(model.actions[0]?.href).toBe(GOVERNANCE_FINDINGS_CANONICAL_PATH);
    expect(model.actions[0]?.href).toBe("/governance/findings");

    expect(model.actions[1]?.label).toBe(START_REVIEW_LABEL);
    expect(model.actions[1]?.href).toBe(REVIEWS_NEW_PATH);
    expect(model.actions[1]?.href).toBe("/architecture/reviews/new");

    expect(model.actions[2]?.href).toBe(REVIEWS_LIST_PATH);
    expect(model.actions[2]?.href).toBe("/architecture/reviews");
  });

  it("SY-34: Working empty CTA points at architectures portfolio or last-open desk", () => {
    expect(
      buildDecisionRegisterEmptyTeaching({ workingMode: true }).actions[2]?.href,
    ).toBe("/architecture/architectures");
    expect(
      buildDecisionRegisterEmptyTeaching({
        workingMode: true,
        lastOpenArchitectureId: "architecture-identity-001",
      }).actions[1]?.href,
    ).toBe("/architecture/architectures/architecture-identity-001");
    expect(
      buildDecisionRegisterEmptyTeaching({ workingMode: true }).actions[1]?.href,
    ).toBe("/architecture/architectures/new");
  });
});
