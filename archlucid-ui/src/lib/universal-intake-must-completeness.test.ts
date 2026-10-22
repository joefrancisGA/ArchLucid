import { describe, expect, it } from "vitest";

import { ARCHITECTURE_DRAFT_UNKNOWN_CONFIRM_LABEL } from "@/lib/architecture/architecture-draft-structured-brief";
import {
  buildIntakeQuestionAnswersForSubmit,
  buildIntakeTransparencyTrail,
  describeUniversalIntakeMustGap,
  evaluateUniversalIntakeMustMissingKeys,
  isUniversalIntakeMustComplete,
  UNIVERSAL_INTAKE_MUST_QUESTION_KEYS,
} from "@/lib/universal-intake-must-completeness";

describe("universal-intake-must-completeness", () => {
  it("treats explicit skip as satisfying a MUST key", () => {
    const skipped = new Set([UNIVERSAL_INTAKE_MUST_QUESTION_KEYS[0] ?? ""]);

    expect(
      isUniversalIntakeMustComplete({
        answers: {},
        skippedQuestionKeys: skipped,
      }),
    ).toBe(false);

    const allSkipped = new Set(UNIVERSAL_INTAKE_MUST_QUESTION_KEYS);

    expect(
      isUniversalIntakeMustComplete({
        answers: {},
        skippedQuestionKeys: allSkipped,
      }),
    ).toBe(true);
  });

  it("names a missing clarification in the readiness gap", () => {
    expect(
      describeUniversalIntakeMustGap({
        answers: { [UNIVERSAL_INTAKE_MUST_QUESTION_KEYS[0] ?? ""]: "Batch jobs only" },
        skippedQuestionKeys: new Set(),
      }),
    ).toMatch(/required clarification/i);
  });

  it("cites engine measurement gaps in Working measurement-honesty mode (PC-02)", () => {
    const onlyActorMissing = Object.fromEntries(
      UNIVERSAL_INTAKE_MUST_QUESTION_KEYS
        .filter((key) => key !== "l0.actor.additional-kinds")
        .map((key) => [key, "answered"]),
    );

    expect(
      describeUniversalIntakeMustGap(
        {
          answers: onlyActorMissing,
          skippedQuestionKeys: new Set(),
        },
        { measurementHonesty: true },
      ),
    ).toMatch(/trust-boundary/i);
  });

  it("builds transparency trail and unknown answers for skipped keys", () => {
    const skipped = new Set([UNIVERSAL_INTAKE_MUST_QUESTION_KEYS[0] ?? ""]);
    const trail = buildIntakeTransparencyTrail(skipped);
    const answers = buildIntakeQuestionAnswersForSubmit({}, skipped);

    expect(trail.skipped).toHaveLength(1);
    expect(answers[UNIVERSAL_INTAKE_MUST_QUESTION_KEYS[0] ?? ""]).toBe(
      ARCHITECTURE_DRAFT_UNKNOWN_CONFIRM_LABEL,
    );
    expect(evaluateUniversalIntakeMustMissingKeys({ answers: {}, skippedQuestionKeys: skipped })).toEqual(
      UNIVERSAL_INTAKE_MUST_QUESTION_KEYS.slice(1),
    );
  });
});
