import { describe, expect, it } from "vitest";

import {
  deriveStatedConstraintContextFromArchitectureRequest,
  deriveStatedConstraintContextFromTexts,
} from "@/lib/review-quality/stated-constraint-context";

describe("deriveStatedConstraintContextFromTexts", () => {
  it("parses RTO and RPO minutes from reliability intake lines", () => {
    const context = deriveStatedConstraintContextFromTexts([
      "Reliability: RTO 4 hours, RPO 30 minutes",
    ]);

    expect(context.rtoMinutes).toBe(240);
    expect(context.rpoMinutes).toBe(30);
  });

  it("parses monthly cost ceiling from cost constraint lines", () => {
    const context = deriveStatedConstraintContextFromTexts(["Cost: monthly budget ceiling $12,500"]);

    expect(context.monthlyCostCeilingUsd).toBe(12500);
  });
});

describe("deriveStatedConstraintContextFromArchitectureRequest", () => {
  it("merges constraints, inline requirements, and intake answers", () => {
    const context = deriveStatedConstraintContextFromArchitectureRequest({
      constraints: ["Cost: $5k monthly cap"],
      inlineRequirements: ["Reliability: RTO 2 hours"],
      intakeQuestionAnswers: {
        "l0.pillar.reliability": "RPO 15 min",
      },
    });

    expect(context.rtoMinutes).toBe(120);
    expect(context.rpoMinutes).toBe(15);
    expect(context.monthlyCostCeilingUsd).toBe(5000);
  });
});
